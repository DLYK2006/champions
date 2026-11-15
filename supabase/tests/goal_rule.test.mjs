// 0007: calorie goal depends on goal type. Bulk >= 90% (no cap); Maintain/Cut 90-110%. Same PGlite harness.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/goal_rule.test.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
const files = readdirSync(dir).filter((f) => f.endsWith(".sql")).sort();
const db = new PGlite();
await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth; create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
// Apply everything before 0007, so we can create a day under the old rule first.
for (const f of files.filter((f) => f < "0007")) await db.exec(readFileSync(dir + f, "utf8"));

const U = { bulk: "00000000-0000-0000-0000-0000000000b1", maint: "00000000-0000-0000-0000-0000000000a1", cut: "00000000-0000-0000-0000-0000000000c1" };
const goal = { bulk: "bulk", maint: "maintain", cut: "cut" };
for (const [k, id] of Object.entries(U)) {
  await db.exec(`insert into auth.users values ('${id}');
    insert into profiles (id, username, goal_type, height_cm, weight_kg, age, target_weight_kg, calorie_target, protein_target_g)
    values ('${id}', '${k}', '${goal[k]}', 175, 70, 25, ${k === "bulk" ? 80 : k === "cut" ? 65 : "null"}, 2700, 100);`);
}
async function meal(user, eventId, kcal, protein) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${U[user]}', false); set role authenticated;`);
  try {
    return (await db.query(`select log_meal($1, $2, 'lunch', $3) r`, [eventId, new Date().toISOString().slice(0, 10),
      JSON.stringify([{ name: "x", calories: kcal, protein_g: protein, carbs_g: 0, fat_g: 0 }])])).rows[0].r;
  } finally { await db.exec(`reset role;`); }
}
const flags = async (user) => (await db.query(`select calorie_goal_completed c, personal_goal_completed g from daily_progress where user_id = $1`, [U[user]])).rows[0];

// Old rule (0003): Bulk at 148% fails, like jay's real test.
let r = await meal("bulk", "10000000-0000-0000-0000-000000000001", 4000, 175);
assert.equal(r.progress.personal_goal_completed, false);

await db.exec(readFileSync(dir + files.find((f) => f.startsWith("0007")), "utf8"));
assert.deepEqual(await flags("bulk"), { c: true, g: true }); // recalculated by 0007's update
console.log("ok - 0007 recalculates an old-rule day");

r = await meal("maint", "20000000-0000-0000-0000-000000000001", 3060, 100); // 113%
assert.equal(r.progress.calorie_goal_completed, false);
r = await meal("cut", "30000000-0000-0000-0000-000000000001", 2000, 100); // 74%
assert.equal(r.progress.calorie_goal_completed, false);
r = await meal("cut", "30000000-0000-0000-0000-000000000002", 500, 0); // 93%
assert.equal(r.progress.calorie_goal_completed, true);
console.log("ok - maintain/cut keep 90-110%");

r = await meal("bulk", "10000000-0000-0000-0000-000000000002", 100, 0); // next bulk meal pays the goal coins now
assert.deepEqual(r.coins_awarded.map((c) => c.reason).sort(), ["both_goals", "calorie_goal", "meal_2"]); // protein_goal was already paid on meal 1
console.log("ok - bulk over target meets the goal; coins paid on the next meal");
console.log("goal rule: all checks pass");
