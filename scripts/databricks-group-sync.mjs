// One-time setup + backfill for the group leaderboard table in Databricks. Safe to re-run (MERGE on group_id + date).
// Run: node --experimental-strip-types --env-file=.env.local scripts/databricks-group-sync.mjs
// Needs SUPABASE_SERVICE_ROLE_KEY and the DATABRICKS_* variables (Daren has them). Owner: @joshuatsou123
import { createClient } from "@supabase/supabase-js";
import { runSql } from "../lib/analytics/databricks.ts";
import { CREATE_GROUP_TABLE, GROUP_TABLE, upsertGroupDayStatement } from "../lib/analytics/groups.ts";

await runSql("CREATE SCHEMA IF NOT EXISTS workspace.digin");
await runSql(CREATE_GROUP_TABLE);
console.log(`table ready: ${GROUP_TABLE}`);

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let copied = 0;
for (let from = 0; ; from += 500) {
  const { data, error } = await admin.from("group_daily_progress")
    .select("group_id, date, eligible_member_count, completed_member_count, completion_percentage, bonus_tier")
    .order("date").range(from, from + 499);
  if (error) throw new Error(error.message);
  for (const row of data) {
    const { statement, parameters } = upsertGroupDayStatement(row);
    await runSql(statement, parameters);
    copied++;
  }
  if (data.length < 500) break;
}
const [[count]] = await runSql(`SELECT COUNT(*) FROM ${GROUP_TABLE}`);
console.log(`group days sent: ${copied}; rows in Databricks: ${count}`);
