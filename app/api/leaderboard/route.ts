// GET /api/leaderboard?date=YYYY-MM-DD -> { source: "databricks" | "supabase", rows: LeaderboardRow[] }
// Group-vs-group ranking (cooperative: groups only). Databricks computes the 7-day scores; if it does not answer within
// 3 s (Free Edition cold start is ~7 s), errors, or has nothing yet, the same score is computed by get_group_leaderboard()
// in Supabase (migration 0012) and `source` says so. Names, opt-outs and the 2-member rule always come from Supabase.
// Owner: @joshuatsou123
import { createClient } from "@supabase/supabase-js";
import { runSql } from "@/lib/analytics/databricks";
import { groupScoresStatement, toScoreRows } from "@/lib/analytics/groups";
import { buildLeaderboard, type LeaderboardRow } from "@/lib/groups/leaderboard";

const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function GET(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } },
    auth: { persistSession: false },
  });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return Response.json({ error: "Sign in first." }, { status: 401 });

  const date = new URL(request.url).searchParams.get("date") ?? "";
  if (!DAY.test(date)) return Response.json({ error: "Send ?date=YYYY-MM-DD." }, { status: 400 });

  try {
    const { statement, parameters, timeoutMs } = groupScoresStatement(date);
    const scores = toScoreRows(await runSql(statement, parameters, timeoutMs));
    if (scores.length) {
      const [{ data: names, error: namesError }, { data: mine, error: mineError }] = await Promise.all([
        supabase.rpc("get_group_names", { p_ids: scores.map((s) => s.group_id) }),
        supabase.rpc("my_group_id"),
      ]);
      if (namesError || mineError) throw new Error(namesError?.message ?? mineError?.message);
      const rows = buildLeaderboard(scores, (names ?? {}) as Record<string, string>, (mine as string | null) ?? null);
      if (rows.length) return Response.json({ source: "databricks", rows });
    }
  } catch (e) {
    console.warn("leaderboard: databricks read failed, using supabase", e instanceof Error ? e.message : e);
  }

  const { data, error } = await supabase.rpc("get_group_leaderboard", { p_today: date });
  if (error) return Response.json({ error: "Couldn't load the leaderboard." }, { status: 500 });
  return Response.json({ source: "supabase", rows: (data ?? []) as LeaderboardRow[] });
}
