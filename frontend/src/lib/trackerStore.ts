import {
  TrackerItem,
  TrackerItemSchema,
  TrackerStatus,
  NewTrackerItemInput,
  createTrackerItem
} from '@opportunity-kit/shared';
import { supabase, isSupabaseLoggedIn, getSupabaseUser } from './supabase';

// ============================================================================
// Application tracker store.
//
// localStorage is always the immediate, offline-safe store. When the student is
// signed in to Supabase we ALSO mirror every change to the `tracker_items`
// table and prefer the remote rows on load. A missing table, missing keys or a
// network failure never breaks the page: it silently stays on localStorage.
// ============================================================================

export const TRACKER_KEY = 'opportunitykit_tracker_items';
const TABLE = 'tracker_items';

export type TrackerSource = 'supabase' | 'local';

export interface TrackerSnapshot {
  items: TrackerItem[];
  source: TrackerSource;
  /** Friendly, non-blocking note when the cloud copy could not be used. */
  notice: string | null;
}

// ---------------------------------------------------------------------------
// localStorage layer
// ---------------------------------------------------------------------------

export function getLocalTrackerItems(): TrackerItem[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(TRACKER_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    // Skip any row that no longer matches the schema instead of crashing.
    return parsed.reduce<TrackerItem[]>((acc, row) => {
      const result = TrackerItemSchema.safeParse(row);
      if (result.success) acc.push(result.data);
      return acc;
    }, []);
  } catch (err) {
    console.warn('[Tracker] Could not read local tracker items:', err);
    return [];
  }
}

function saveLocalTrackerItems(items: TrackerItem[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(TRACKER_KEY, JSON.stringify(items));
  } catch (err) {
    console.warn('[Tracker] Could not save tracker items locally:', err);
  }
}

// ---------------------------------------------------------------------------
// Supabase row mapping
// ---------------------------------------------------------------------------

function toRow(item: TrackerItem, userId: string) {
  return {
    id: item.id,
    user_id: userId,
    title: item.title,
    source: item.source,
    source_url: item.sourceUrl,
    deadline: item.deadline,
    readiness_score: item.readinessScore,
    readiness_label: item.readinessLabel,
    status: item.status,
    notes: item.notes,
    counts: item.counts ?? null,
    next_steps: item.nextSteps,
    created_at: item.createdAt,
    updated_at: item.updatedAt,
    item_data: item
  };
}

function fromRow(row: any): TrackerItem | null {
  const candidate = row?.item_data ?? {
    id: row?.id,
    title: row?.title,
    source: row?.source,
    sourceUrl: row?.source_url,
    deadline: row?.deadline,
    readinessScore: row?.readiness_score,
    readinessLabel: row?.readiness_label,
    status: row?.status,
    notes: row?.notes,
    counts: row?.counts ?? undefined,
    nextSteps: row?.next_steps ?? [],
    createdAt: row?.created_at,
    updatedAt: row?.updated_at
  };
  const parsed = TrackerItemSchema.safeParse(candidate);
  return parsed.success ? parsed.data : null;
}

/** Current signed-in user id, or null when offline / not configured. */
async function currentUserId(): Promise<string | null> {
  try {
    if (!supabase) return null;
    const loggedIn = await isSupabaseLoggedIn();
    if (!loggedIn) return null;
    const user = await getSupabaseUser();
    return user?.id ?? null;
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Public API
// ---------------------------------------------------------------------------

/** Loads the tracker, preferring the cloud copy when signed in. */
export async function loadTrackerItems(): Promise<TrackerSnapshot> {
  const local = getLocalTrackerItems();
  const userId = await currentUserId();
  if (!userId || !supabase) {
    return { items: local, source: 'local', notice: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (error) throw error;

    const remote = (data ?? []).map(fromRow).filter((i): i is TrackerItem => i !== null);
    saveLocalTrackerItems(remote);
    return { items: remote, source: 'supabase', notice: null };
  } catch (err) {
    console.warn('[Tracker] Cloud load failed, using local copy:', err);
    return {
      items: local,
      source: 'local',
      notice: 'Saved on this device only — the cloud tracker is unavailable right now.'
    };
  }
}

/** Adds one item and returns it. Never throws. */
export async function addTrackerItem(input: NewTrackerItemInput): Promise<TrackerItem> {
  const item = createTrackerItem(input);
  const items = [item, ...getLocalTrackerItems()];
  saveLocalTrackerItems(items);

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase.from(TABLE).upsert(toRow(item, userId), { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      console.warn('[Tracker] Could not mirror new item to the cloud:', err);
    }
  }
  return item;
}

/** Applies a partial change (status, notes, deadline, title…) and returns the item. */
export async function updateTrackerItem(
  id: string,
  patch: Partial<Pick<TrackerItem, 'status' | 'notes' | 'title' | 'deadline' | 'source' | 'sourceUrl'>>
): Promise<TrackerItem | null> {
  const items = getLocalTrackerItems();
  const index = items.findIndex((item) => item.id === id);
  if (index === -1) return null;

  const updated: TrackerItem = {
    ...items[index],
    ...patch,
    updatedAt: new Date().toISOString()
  };
  items[index] = updated;
  saveLocalTrackerItems(items);

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase.from(TABLE).upsert(toRow(updated, userId), { onConflict: 'id' });
      if (error) throw error;
    } catch (err) {
      console.warn('[Tracker] Could not mirror update to the cloud:', err);
    }
  }
  return updated;
}

/** Removes one item. */
export async function deleteTrackerItem(id: string): Promise<void> {
  saveLocalTrackerItems(getLocalTrackerItems().filter((item) => item.id !== id));

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      console.warn('[Tracker] Could not delete the cloud copy:', err);
    }
  }
}

export const TRACKER_STATUS_LABELS: Record<TrackerStatus, string> = {
  Interested: 'Interested',
  Preparing: 'Preparing',
  Applied: 'Applied',
  Interview: 'Interview',
  Result: 'Result'
};

export const trackerStore = {
  loadTrackerItems,
  getLocalTrackerItems,
  addTrackerItem,
  updateTrackerItem,
  deleteTrackerItem
};
