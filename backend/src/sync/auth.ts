export interface SyncUser {
  id: string;
  email?: string;
}

function decodeJwtPayload(token: string): SyncUser | null {
  try {
    const parts = token.split('.');
    if (parts.length !== 3) return null;
    const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString('utf8')) as {
      sub?: string;
      email?: string;
    };
    if (!payload.sub) return null;
    return { id: payload.sub, email: payload.email };
  } catch {
    return null;
  }
}

/**
 * Checks the Supabase access token. When Supabase env is missing (local JSON
 * store), the JWT payload is read without a network call so tests still work.
 */
export async function verifySupabaseToken(token: string): Promise<SyncUser | null> {
  const trimmed = token.trim();
  if (!trimmed) return null;

  const supabaseUrl = process.env.SUPABASE_URL?.trim();
  const supabaseAnonKey = process.env.SUPABASE_ANON_KEY?.trim();
  if (!supabaseUrl || !supabaseAnonKey) {
    return decodeJwtPayload(trimmed);
  }

  try {
    const res = await fetch(`${supabaseUrl.replace(/\/+$/, '')}/auth/v1/user`, {
      headers: {
        Authorization: `Bearer ${trimmed}`,
        apikey: supabaseAnonKey
      }
    });
    if (!res.ok) return null;
    const user = (await res.json()) as { id?: string; email?: string };
    if (!user.id) return null;
    return { id: user.id, email: user.email };
  } catch {
    return null;
  }
}

export function readBearerToken(header: string | undefined): string | null {
  if (!header) return null;
  const match = header.match(/^Bearer\s+(.+)$/i);
  return match?.[1]?.trim() || null;
}
