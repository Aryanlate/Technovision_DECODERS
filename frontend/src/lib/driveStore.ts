import {
  DriveChecklist,
  DriveChecklistSchema,
  DriveChecklistInput,
  createDriveChecklist
} from '@opportunity-kit/shared';
import { supabase, isSupabaseLoggedIn, getSupabaseUser } from './supabase';

// ============================================================================
// Partner-published drive checklists.
//
// A company or placement cell publishes a checklist once and shares one link
// (/drive/[id]). Students open that link and compare it with their own profile.
//
// With Supabase configured the checklist lives in the `drive_checklists` table
// so the link works for anyone. Without it, the checklist is cached in
// localStorage, which means the link only opens in this same browser — the same
// graceful fallback the tracker and share links already use.
// ============================================================================

export const DRIVE_KEY = 'opportunitykit_drive_checklists';
export const DRIVES_CHANGED_EVENT = 'opportunitykit_drives_changed';
const TABLE = 'drive_checklists';

export type DriveSource = 'supabase' | 'local';

export interface DriveListResult {
  drives: DriveChecklist[];
  source: DriveSource;
  notice: string | null;
}

// ---------------------------------------------------------------------------
// localStorage layer
// ---------------------------------------------------------------------------

export function getLocalDriveChecklists(): DriveChecklist[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(DRIVE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<DriveChecklist[]>((acc, row) => {
      const result = DriveChecklistSchema.safeParse(row);
      if (result.success) acc.push(result.data);
      return acc;
    }, []);
  } catch (err) {
    console.warn('[Drive] Could not read local drive checklists:', err);
    return [];
  }
}

function saveLocalDriveChecklists(drives: DriveChecklist[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(DRIVE_KEY, JSON.stringify(drives));
  } catch (err) {
    console.warn('[Drive] Could not save drive checklists locally:', err);
  }
}

function notifyChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(DRIVES_CHANGED_EVENT));
}

// ---------------------------------------------------------------------------
// Supabase mapping
// ---------------------------------------------------------------------------

function toRow(drive: DriveChecklist, userId: string | null) {
  return {
    id: drive.id,
    user_id: userId,
    created_at: drive.createdAt,
    title: drive.title,
    partner_name: drive.partnerName,
    drive_data: drive
  };
}

function fromRow(row: any): DriveChecklist | null {
  const parsed = DriveChecklistSchema.safeParse(row?.drive_data);
  return parsed.success ? parsed.data : null;
}

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

/** Publishes a checklist and returns it. Never throws. */
export async function createPublishedDrive(
  input: DriveChecklistInput
): Promise<{ drive: DriveChecklist; source: DriveSource }> {
  const userId = await currentUserId();
  const drive = createDriveChecklist(input);

  // Always cache locally so the publisher keeps the link even when offline.
  saveLocalDriveChecklists([drive, ...getLocalDriveChecklists()]);

  let source: DriveSource = 'local';
  if (userId && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE)
        .upsert(toRow(drive, userId), { onConflict: 'id' });
      if (error) throw error;
      source = 'supabase';
    } catch (err) {
      console.warn('[Drive] Could not publish the drive to the cloud:', err);
    }
  }

  notifyChanged();
  return { drive, source };
}

/** The published drives, newest first. */
export async function loadDriveChecklists(): Promise<DriveListResult> {
  const local = getLocalDriveChecklists();
  if (!supabase) {
    return { drives: local, source: 'local', notice: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .order('created_at', { ascending: false });
    if (error) throw error;

    const remote = (data ?? []).map(fromRow).filter((d): d is DriveChecklist => d !== null);
    if (remote.length > 0) {
      saveLocalDriveChecklists(remote);
      return { drives: remote, source: 'supabase', notice: null };
    }
    return { drives: local, source: 'local', notice: null };
  } catch (err) {
    console.warn('[Drive] Cloud list failed, using local copy:', err);
    return {
      drives: local,
      source: 'local',
      notice: 'Showing drives saved on this device — the cloud list is unavailable right now.'
    };
  }
}

/**
 * Reads one drive for the public /drive/[id] page.
 * Returns null when the id is unknown.
 */
export async function getPublicDrive(id: string): Promise<DriveChecklist | null> {
  if (!id) return null;

  const local = getLocalDriveChecklists().find((d) => d.id === id);
  if (local) return local;

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      return fromRow(data);
    } catch (err) {
      console.warn('[Drive] Cloud lookup failed:', err);
    }
  }
  return null;
}

/** Removes a published drive. */
export async function deleteDrive(id: string): Promise<void> {
  saveLocalDriveChecklists(getLocalDriveChecklists().filter((d) => d.id !== id));
  notifyChanged();

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      console.warn('[Drive] Could not delete the cloud drive:', err);
    }
  }
}

/** Absolute URL for a drive id, for the "Copy link" action. */
export function driveUrl(id: string): string {
  if (typeof window === 'undefined') return `/drive/${id}`;
  return `${window.location.origin}/drive/${id}`;
}

export const driveStore = {
  createPublishedDrive,
  loadDriveChecklists,
  getPublicDrive,
  deleteDrive,
  driveUrl,
  getLocalDriveChecklists
};
