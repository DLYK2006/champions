// Group leaderboard types and the pure ranking step (design: docs/superpowers/specs/2026-11-15-group-leaderboard-design.md).
// Pure: no React, no Supabase, so node --test can run it. The fetch wrappers live in ./api. Owner: @joshuatsou123
// Cooperative by design: groups only, never individuals, and nothing but name, score, streak and rank leaves here.

export interface ScoreRow { group_id: string; consistency_7d: number; full_bloom_streak: number }
export interface LeaderboardRow { rank: number; group_name: string; consistency_7d: number; full_bloom_streak: number; is_mine: boolean }
export interface LeaderboardResponse { source: "databricks" | "supabase"; rows: LeaderboardRow[] }

export const LEADERBOARD_SIZE = 10;

/**
 * Ranks scored groups for display: by 7-day score, then full-bloom streak, then group id (so ties never reshuffle).
 * A group missing from `names` is hidden (opted out) and is dropped before ranking. Returns the top `limit` plus the
 * caller's own group, with its true rank, when it falls outside them.
 */
export function buildLeaderboard(
  scores: ScoreRow[],
  names: Record<string, string>,
  myGroupId: string | null,
  limit: number = LEADERBOARD_SIZE,
): LeaderboardRow[] {
  return scores
    .filter((s) => names[s.group_id] !== undefined)
    .sort((a, b) =>
      b.consistency_7d - a.consistency_7d ||
      b.full_bloom_streak - a.full_bloom_streak ||
      (a.group_id < b.group_id ? -1 : a.group_id > b.group_id ? 1 : 0))
    .map((s, i) => ({
      rank: i + 1,
      group_name: names[s.group_id],
      consistency_7d: s.consistency_7d,
      full_bloom_streak: s.full_bloom_streak,
      is_mine: s.group_id === myGroupId,
    }))
    .filter((row) => row.rank <= limit || row.is_mine);
}

/**
 * True when the caller is in a group but it is not in `rows`. A Databricks answer like that may be incomplete (the
 * group's daily copies failed or lagged), so the route uses the Supabase score instead. An opted-out group also lands
 * here and just takes the (equally correct) fallback.
 */
export const missingOwnGroup = (rows: LeaderboardRow[], myGroupId: string | null): boolean =>
  myGroupId !== null && !rows.some((row) => row.is_mine);
