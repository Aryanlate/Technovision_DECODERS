import {
  ShareSnapshot,
  ShareSnapshotSchema,
  ShareSnapshotInput,
  PublicShareSnapshot,
  createShareSnapshot,
  toPublicShareSnapshot,
  isShareActive
} from '@opportunity-kit/shared';
import { supabase, isSupabaseLoggedIn, getSupabaseUser } from './supabase';

// ============================================================================
// Shareable result links.
//
// A snapshot is a sanitised, read-only projection of one result: opportunity,
// statuses, score and next steps — never any profile contact details or links.
// Links expire after 7 days and the owner can revoke them from the tracker.
//
// With Supabase configured the snapshot lives in the `share_snapshots` table so
// anyone can open /share/[id]. Without it, the snapshot is cached in
// localStorage, which means the link only opens in this same browser.
// ============================================================================

export const SHARE_KEY = 'opportunitykit_share_links';
const TABLE = 'share_snapshots';

export type ShareSource = 'supabase' | 'local';

export interface ShareListResult {
  snapshots: ShareSnapshot[];
  source: ShareSource;
  notice: string | null;
}

// ---------------------------------------------------------------------------
// localStorage layer
// ---------------------------------------------------------------------------

export function getLocalShareSnapshots(): ShareSnapshot[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(SHARE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed.reduce<ShareSnapshot[]>((acc, row) => {
      const result = ShareSnapshotSchema.safeParse(row);
      if (result.success) acc.push(result.data);
      return acc;
    }, []);
  } catch (err) {
    console.warn('[Share] Could not read local share links:', err);
    return [];
  }
}

function saveLocalShareSnapshots(snapshots: ShareSnapshot[]): void {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(SHARE_KEY, JSON.stringify(snapshots));
  } catch (err) {
    console.warn('[Share] Could not save share links locally:', err);
  }
}

// ---------------------------------------------------------------------------
// Supabase mapping
// ---------------------------------------------------------------------------

function toRow(snapshot: ShareSnapshot, userId: string | null) {
  return {
    id: snapshot.id,
    user_id: userId,
    created_at: snapshot.createdAt,
    expires_at: snapshot.expiresAt,
    revoked: snapshot.revoked,
    opportunity_title: snapshot.opportunityTitle,
    snapshot_data: snapshot
  };
}

function fromRow(row: any): ShareSnapshot | null {
  const parsed = ShareSnapshotSchema.safeParse(row?.snapshot_data);
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

/** Builds and stores a new share link. Never throws; returns the snapshot. */
export async function createShareLink(
  input: ShareSnapshotInput
): Promise<{ snapshot: ShareSnapshot; source: ShareSource }> {
  const userId = await currentUserId();
  const snapshot = createShareSnapshot({ ...input, ownerId: userId ?? undefined });

  // Always cache locally so the owner can manage and revoke the link.
  saveLocalShareSnapshots([snapshot, ...getLocalShareSnapshots()]);

  let source: ShareSource = 'local';
  if (userId && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE)
        .upsert(toRow(snapshot, userId), { onConflict: 'id' });
      if (error) throw error;
      source = 'supabase';
    } catch (err) {
      console.warn('[Share] Could not publish the link to the cloud:', err);
    }
  }
  return { snapshot, source };
}

/** Owner's list of links, newest first. */
export async function loadShareLinks(): Promise<ShareListResult> {
  const local = getLocalShareSnapshots();
  const userId = await currentUserId();
  if (!userId || !supabase) {
    return { snapshots: local, source: 'local', notice: null };
  }

  try {
    const { data, error } = await supabase
      .from(TABLE)
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;

    const remote = (data ?? []).map(fromRow).filter((s): s is ShareSnapshot => s !== null);
    saveLocalShareSnapshots(remote);
    return { snapshots: remote, source: 'supabase', notice: null };
  } catch (err) {
    console.warn('[Share] Cloud list failed, using local copy:', err);
    return {
      snapshots: local,
      source: 'local',
      notice: 'Showing links saved on this device — the cloud list is unavailable right now.'
    };
  }
}

/**
 * Reads one snapshot for the public /share/[id] page.
 * Returns null when the link is unknown, expired or revoked.
 */
export async function getPublicShare(id: string): Promise<PublicShareSnapshot | null> {
  if (!id) return null;

  const local = getLocalShareSnapshots().find((s) => s.id === id);
  if (local && isShareActive(local)) return toPublicShareSnapshot(local);

  if (supabase) {
    try {
      const { data, error } = await supabase
        .from(TABLE)
        .select('*')
        .eq('id', id)
        .maybeSingle();
      if (error) throw error;
      const snapshot = fromRow(data);
      if (snapshot && isShareActive(snapshot)) return toPublicShareSnapshot(snapshot);
    } catch (err) {
      console.warn('[Share] Cloud lookup failed:', err);
    }
  }
  return null;
}

/** Marks a link revoked so it stops working immediately. */
export async function revokeShareLink(id: string): Promise<void> {
  const snapshots = getLocalShareSnapshots().map((s) => (s.id === id ? { ...s, revoked: true } : s));
  saveLocalShareSnapshots(snapshots);

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase
        .from(TABLE)
        .update({ revoked: true })
        .eq('id', id)
        .eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      console.warn('[Share] Could not revoke the cloud link:', err);
    }
  }
}

/** Removes a link entirely. */
export async function deleteShareLink(id: string): Promise<void> {
  saveLocalShareSnapshots(getLocalShareSnapshots().filter((s) => s.id !== id));

  const userId = await currentUserId();
  if (userId && supabase) {
    try {
      const { error } = await supabase.from(TABLE).delete().eq('id', id).eq('user_id', userId);
      if (error) throw error;
    } catch (err) {
      console.warn('[Share] Could not delete the cloud link:', err);
    }
  }
}

/** Absolute URL for a snapshot id, for the "Copy link" action. */
export function shareUrl(id: string): string {
  if (typeof window === 'undefined') return `/share/${id}`;
  return `${window.location.origin}/share/${id}`;
}

export const shareStore = {
  createShareLink,
  loadShareLinks,
  getPublicShare,
  revokeShareLink,
  deleteShareLink,
  shareUrl,
  getLocalShareSnapshots
};
