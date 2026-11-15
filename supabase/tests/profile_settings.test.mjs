// 0005 profile settings: defaults, own-row edits, coins still protected. Same PGlite harness as groups.test.mjs.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/profile_settings.test.mjs
import { PGlite } from "@electric-sql/pglite";
import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const dir = fileURLToPath(new URL("../migrations/", import.meta.url));
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
for (const f of readdirSync(dir).filter((f) => f.endsWith(".sql")).sort()) await db.exec(readFileSync(dir + f, "utf8"));

const A = "00000000-0000-0000-0000-00000000000a";
const B = "00000000-0000-0000-0000-00000000000b";
async function as(user, sql) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${user}', false); set role authenticated;`);
  try { return await db.query(sql); } finally { await db.exec(`reset role;`); }
}
await db.exec(`insert into auth.users values ('${A}'), ('${B}');`);
// Onboarding insert, now also allowed to set unit_preference.
await as(A, `insert into profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g, unit_preference)
             values ('${A}', 'a', 'cut', 170, 80, 30, 2000, 120, 'imperial')`);
await as(B, `insert into profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g)
             values ('${B}', 'b', 'bulk', 180, 70, 22, 2800, 150)`);

const row = async (id) => (await db.query(`select unit_preference, hide_status_from_group, notify_meal_reminders, notify_group_alerts, coin_balance from profiles where id = '${id}'`)).rows[0];
assert.deepEqual(await row(B), { unit_preference: "metric", hide_status_from_group: false, notify_meal_reminders: false, notify_group_alerts: false, coin_balance: 0 });
assert.equal((await row(A)).unit_preference, "imperial");

await as(A, `update profiles set hide_status_from_group = true, notify_meal_reminders = true, notify_group_alerts = true, unit_preference = 'metric', calorie_target = 2100`);
assert.deepEqual(await row(A), { unit_preference: "metric", hide_status_from_group: true, notify_meal_reminders: true, notify_group_alerts: true, coin_balance: 0 });

await assert.rejects(as(A, `update profiles set unit_preference = 'stone'`), /check/);
await assert.rejects(as(A, `update profiles set coin_balance = 999`), /permission denied/);
await as(A, `update profiles set notify_group_alerts = false where id = '${B}'`); // RLS: other rows untouched
assert.equal((await row(B)).notify_group_alerts, false);
assert.equal((await as(A, `select count(*)::int n from profiles where id = '${A}' and notify_group_alerts`)).rows[0].n, 1);
console.log("profile settings: all checks pass");
