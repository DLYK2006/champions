// Group badges and invite links (PRD 8.2). Pure helpers, no React or Supabase. Owner: @joshuatsou123.

/** Badge ids for new groups. Jay's UI maps these to art; the database stores the id as text. */
export const GROUP_BADGES = ["leaf", "dumbbell", "flame", "trophy", "apple", "bolt", "star"] as const;
export type GroupBadge = (typeof GROUP_BADGES)[number];
export const DEFAULT_BADGE: GroupBadge = "leaf";

const CODE_RE = /^[A-Z0-9]{6}$/;

/** A shareable link that opens the Groups page ready to join: https://host/groups?code=ABC123 */
export function inviteLink(origin: string, code: string): string {
  return `${origin.replace(/\/+$/, "")}/groups?code=${encodeURIComponent(code.trim().toUpperCase())}`;
}

/** The invite code in a URL search string (e.g. "?code=abc123"), upper-cased, or null if absent or malformed. */
export function codeFromSearch(search: string): string | null {
  const raw = new URLSearchParams(search).get("code");
  const code = raw?.trim().toUpperCase() ?? "";
  return CODE_RE.test(code) ? code : null;
}

// A signed-out person who opens an invite link is sent to onboarding first, so the code is kept for the
// group step. sessionStorage can be unavailable (private mode), so every call is guarded.
const PENDING_KEY = "dig-in:pending-invite";

export function savePendingCode(code: string): void {
  try { sessionStorage.setItem(PENDING_KEY, code); } catch { /* storage unavailable: they can type the code */ }
}
export function peekPendingCode(): string | null {
  try {
    const code = sessionStorage.getItem(PENDING_KEY)?.toUpperCase() ?? "";
    return CODE_RE.test(code) ? code : null;
  } catch { return null; }
}
export function clearPendingCode(): void {
  try { sessionStorage.removeItem(PENDING_KEY); } catch { /* nothing to clear */ }
}
