// One-time setup + backfill for the Databricks analytics table. Safe to re-run (MERGE on event_id).
// Run: node --experimental-strip-types --env-file=.env.local scripts/databricks-sync.mjs
// Owner: @DLYK2006
import { createClient } from "@supabase/supabase-js";
import { CREATE_TABLE, MEALS_TABLE, runSql, upsertMeal } from "../lib/analytics/databricks.ts";

await runSql("CREATE SCHEMA IF NOT EXISTS workspace.digin");
await runSql(CREATE_TABLE);
console.log(`table ready: ${MEALS_TABLE}`);

const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY, { auth: { persistSession: false } });
let copied = 0;
for (let from = 0; ; from += 500) {
  const { data, error } = await admin.from("meals")
    .select("event_id, user_id, date, meal_type, calories, protein_g, carbs_g, fat_g, created_at")
    .order("created_at").range(from, from + 499);
  if (error) throw new Error(error.message);
  for (const m of data) {
    await upsertMeal(m);
    copied++;
  }
  if (data.length < 500) break;
}
const [[count]] = await runSql(`SELECT COUNT(*) FROM ${MEALS_TABLE}`);
console.log(`meals sent: ${copied}; rows in Databricks: ${count}`);
