// POST /api/analytics/group { date }: copy the caller's group row for that day to Databricks. Owner: @joshuatsou123
// Called right after log_meal, like the meal copy. The row is read from Supabase here (RLS limits it to the caller's own
// group), never taken from the client, so nobody can send made-up counts. A failure only means Databricks is behind:
// GET /api/leaderboard falls back to Supabase and scripts/databricks-group-sync.mjs catches up.
import { createClient } from "@supabase/supabase-js";
import { runSql } from "@/lib/analytics/databricks";
import { CREATE_GROUP_TABLE, upsertGroupDayStatement } from "@/lib/analytics/groups";

const DAY = /^\d{4}-\d{2}-\d{2}$/;
let tableReady = false; // CREATE TABLE IF NOT EXISTS once per server instance

export async function POST(request: Request) {
  const token = request.headers.get("authorization")?.replace(/^Bearer /, "");
  if (!token) return Response.json({ error: "Sign in first." }, { status: 401 });
  const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!, {
    global: { headers: { Authorization: `Bearer ${token}` } }, // capitalized: see app/api/scan/route.ts
    auth: { persistSession: false },
  });
  const { data: auth } = await supabase.auth.getUser(token);
  if (!auth.user) return Response.json({ error: "Sign in first." }, { status: 401 });

  const body = await request.json().catch(() => null);
  if (typeof body?.date !== "string" || !DAY.test(body.date)) return Response.json({ error: "Send { date: YYYY-MM-DD }." }, { status: 400 });

  const { data: row, error } = await supabase
    .from("group_daily_progress")
    .select("group_id, date, eligible_member_count, completed_member_count, completion_percentage, bonus_tier")
    .eq("date", body.date)
    .maybeSingle();
  if (error || !row) return Response.json({ error: "No group progress for that day." }, { status: 404 });

  try {
    if (!tableReady) {
      await runSql(CREATE_GROUP_TABLE);
      tableReady = true;
    }
    const { statement, parameters } = upsertGroupDayStatement(row);
    await runSql(statement, parameters);
  } catch (e) {
    console.error("analytics: databricks group write failed", e instanceof Error ? e.message : e);
    return Response.json({ error: "Analytics copy failed; your progress itself is saved." }, { status: 502 });
  }
  return new Response(null, { status: 204 });
}
