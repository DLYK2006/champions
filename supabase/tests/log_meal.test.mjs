// log_meal reports group bonus coins (0003). Same PGlite harness as groups.test.mjs.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/log_meal.test.mjs
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
for (const f of readdirSync(dir).sort()) await db.exec(readFileSync(dir + f, "utf8"));

const U = { a: "00000000-0000-0000-0000-00000000000a", b: "00000000-0000-0000-0000-00000000000b" };
for (const [k, id] of Object.entries(U)) {
  await db.exec(`insert into auth.users values ('${id}');
    insert into public.profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g)
    values ('${id}', 'user_${k}', 'maintain', 175, 70, 25, 2000, 100);`);
}
async function rpc(user, fn, ...args) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${U[user]}', false); set role authenticated;`);
  try { return (await db.query(`select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) r`, args)).rows[0].r; }
  finally { await db.exec(`reset role;`); }
}
const today = new Date().toISOString().slice(0, 10);
const goalMeal = JSON.stringify([{ name: "x", calories: 2000, protein_g: 100, carbs_g: 0, fat_g: 0 }]);
const reasons = (r) => r.coins_awarded.map((c) => `${c.reason}+${c.amount}`);

const g = await rpc("a", "create_group", "Pair", "star");
await rpc("b", "join_group", g.invite_code);

const a = await rpc("a", "log_meal", "11111111-1111-1111-1111-111111111111", today, "lunch", goalMeal);
assert.deepEqual(reasons(a), ["meal_1+10", "calorie_goal+20", "protein_goal+10", "both_goals+10"]); // 1/2: no bonus
assert.equal(a.coin_balance, 50);

const b = await rpc("b", "log_meal", "22222222-2222-2222-2222-222222222222", today, "lunch", goalMeal);
assert.deepEqual(reasons(b), ["meal_1+10", "calorie_goal+20", "protein_goal+10", "both_goals+10", "group_bonus+30"]);
assert.equal(b.coin_balance, 80);
assert.equal(b.group.bonus_tier, 30);

const replay = await rpc("b", "log_meal", "22222222-2222-2222-2222-222222222222", today, "lunch", goalMeal);
assert.deepEqual(replay.coins_awarded, []); // nothing new to report on a replay
assert.equal(replay.coin_balance, 80);

const solo = await rpc("a", "log_meal", "33333333-3333-3333-3333-333333333333", today, "snack", "[]");
assert.deepEqual(solo.coins_awarded, []); // a's 30 was paid during b's meal, not reported again
console.log("log_meal group bonus: all checks pass");
