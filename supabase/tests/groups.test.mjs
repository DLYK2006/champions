// Groups SQL tests: applies 0001 + 0002 in an in-memory Postgres (PGlite) with Supabase stand-ins
// (auth.uid(), anon/authenticated roles, realtime publication) and checks tiers, payouts, RLS and privacy.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/groups.test.mjs
// PGlite is not real Supabase: still smoke-test against the project before the demo.

import { PGlite } from "@electric-sql/pglite";
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const repo = fileURLToPath(new URL("../", import.meta.url));
const db = new PGlite();

await db.exec(`
  create role anon nologin; create role authenticated nologin;
  create schema auth;
  create table auth.users (id uuid primary key);
  create function auth.uid() returns uuid language sql stable
    as $$ select nullif(current_setting('request.jwt.claim.sub', true), '')::uuid $$;
  create publication supabase_realtime;
  grant usage on schema public, auth to anon, authenticated;
  alter default privileges in schema public grant all on tables to anon, authenticated;
  alter default privileges in schema public grant execute on functions to anon, authenticated;
`);
await db.exec(readFileSync(`${repo}migrations/0001_core.sql`, "utf8"));
await db.exec(readFileSync(`${repo}migrations/0002_groups.sql`, "utf8"));
console.log("migrations applied");

const U = { a: "00000000-0000-0000-0000-00000000000a", b: "00000000-0000-0000-0000-00000000000b",
            c: "00000000-0000-0000-0000-00000000000c", d: "00000000-0000-0000-0000-00000000000d",
            e: "00000000-0000-0000-0000-00000000000e" };
for (const [k, id] of Object.entries(U)) {
  await db.exec(`insert into auth.users values ('${id}');
    insert into public.profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g, avatar)
    values ('${id}', 'user_${k}', 'maintain', 175, 70, 25, 2000, 100, '{"top":"x"}');`);
}

// Run as a signed-in user (RLS applies, like the real client).
async function as(user, sql, params) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${U[user]}', false); set role authenticated;`);
  try { return await db.query(sql, params); }
  finally { await db.exec(`reset role;`); }
}
const rpc = async (user, fn, ...args) => (await as(user, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as r`, args)).rows[0].r;
const fails = async (p, msg) => { await assert.rejects(p, (e) => { assert.match(e.message, msg); return true; }); };
const today = new Date().toISOString().slice(0, 10);
const meal = (user, id) => rpc(user, "log_meal", id, today, "lunch",
  JSON.stringify([{ name: "x", calories: 2000, protein_g: 100, carbs_g: 200, fat_g: 60 }]));
const groupCoins = async (user) => Number((await db.query(
  `select coalesce(sum(amount),0)::int n from coin_transactions where user_id=$1 and reason like 'group_tier_%'`, [U[user]])).rows[0].n);
const balance = async (user) => Number((await db.query(`select coin_balance from profiles where id=$1`, [U[user]])).rows[0].coin_balance);

let passed = 0;
const t = async (name, fn) => { await fn(); passed++; console.log("ok -", name); };

let g;
await t("create_group returns a Group with a 6-char code", async () => {
  g = await rpc("a", "create_group", "  Gym Rats ", "dumbbell");
  assert.equal(g.name, "Gym Rats");
  assert.match(g.invite_code, /^[A-HJ-NP-Z2-9]{6}$/);
  assert.equal(g.creator_id, U.a);
  assert.deepEqual(Object.keys(g).sort(), ["badge", "creator_id", "id", "invite_code", "name"]);
});
await t("cannot create or join a second group", async () => {
  await fails(rpc("a", "create_group", "Again", "x"), /already in a group/);
  await fails(rpc("a", "join_group", g.invite_code), /already in a group/);
});
await t("validation: empty name, bad code", async () => {
  await fails(rpc("b", "create_group", "   ", "x"), /group name/);
  await fails(rpc("b", "join_group", "ZZZZZZ"), /no group with that code/);
});
await t("join is case/space tolerant; max 4 members", async () => {
  await rpc("b", "join_group", ` ${g.invite_code.toLowerCase()} `);
  await rpc("c", "join_group", g.invite_code);
  await rpc("d", "join_group", g.invite_code);
  await fails(rpc("e", "join_group", g.invite_code), /full/);
});
await t("d leaves so the group is a, b, c", async () => {
  await rpc("d", "leave_group");
  await fails(rpc("d", "leave_group"), /not in a group/);
  const s = await rpc("a", "get_group_status", today);
  assert.equal(s.members.length, 3);
  assert.equal(s.progress.eligible_member_count, 3);
});

await t("1 of 3 done (33%): no group coins", async () => {
  const r = await meal("a", "11111111-1111-1111-1111-111111111111");
  assert.equal(r.group.completed_member_count, 1);
  assert.equal(r.group.bonus_tier, 0);
  assert.equal(await groupCoins("a"), 0);
});
await t("2 of 3 done (66.7%): tier 10 pays both completed members", async () => {
  const r = await meal("b", "22222222-2222-2222-2222-222222222222");
  assert.equal(r.group.completion_percentage, 66.7);
  assert.equal(r.group.bonus_tier, 10);
  assert.equal(await groupCoins("a"), 10); // a was paid when b completed
  assert.equal(await groupCoins("b"), 10);
  assert.equal(await groupCoins("c"), 0);
});
await t("3 of 3 done: tier 30 pays the difference, total capped at 30 each", async () => {
  const before = await balance("c");
  const r = await meal("c", "33333333-3333-3333-3333-333333333333");
  assert.equal(r.group.bonus_tier, 30);
  assert.equal(await groupCoins("a"), 30);
  assert.equal(await groupCoins("b"), 30);
  assert.equal(await groupCoins("c"), 30); // late completer gets the current tier
  assert.equal(r.coin_balance, before + 50 + 30); // c's own 50 personal + 30 group, read after evaluate
});
await t("more meals / repeated events pay nothing extra", async () => {
  await rpc("a", "log_meal", "44444444-4444-4444-4444-444444444444", today, "snack", "[]"); // empty meal, goals unchanged
  await rpc("a", "log_meal", "11111111-1111-1111-1111-111111111111", today, "lunch", "[]");
  assert.equal(await groupCoins("a"), 30);
  assert.equal(await groupCoins("b"), 30);
});
await t("a member joining mid-day lowers % but never claws coins back", async () => {
  await rpc("e", "join_group", g.invite_code);
  const s = await rpc("a", "get_group_status", today);
  assert.equal(s.progress.eligible_member_count, 4);
  assert.equal(s.progress.completion_percentage, 75);
  assert.equal(s.progress.bonus_tier, 10);
  assert.equal(await groupCoins("a"), 30);
});
await t("e completes: 4 of 4, e is paid the full 30 immediately", async () => {
  await meal("e", "55555555-5555-5555-5555-555555555555");
  assert.equal(await groupCoins("e"), 30);
  assert.equal(await groupCoins("a"), 30);
});

await t("privacy: members cannot read each other's progress or weights", async () => {
  const dp = await as("b", `select user_id from daily_progress`);
  assert.deepEqual(dp.rows.map((r) => r.user_id), [U.b]);
  const pr = await as("b", `select id from profiles`);
  assert.deepEqual(pr.rows.map((r) => r.id), [U.b]);
  const s = await rpc("b", "get_group_status", today);
  for (const m of s.members) {
    assert.deepEqual(Object.keys(m).sort(), ["avatar", "equipped", "personal_goal_completed", "user_id", "username"]);
  }
  assert.equal(s.members.every((m) => m.personal_goal_completed), true);
});
await t("RLS: members read their group + roster + progress, outsiders see nothing", async () => {
  assert.equal((await as("b", `select * from groups`)).rows.length, 1);
  assert.equal((await as("b", `select * from group_members`)).rows.length, 4);
  assert.ok((await as("b", `select * from group_daily_progress`)).rows.length >= 1);
  await db.exec(`insert into auth.users values ('00000000-0000-0000-0000-0000000000ff');`);
  U.f = "00000000-0000-0000-0000-0000000000ff";
  await db.exec(`insert into profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g)
    values ('${U.f}', 'user_f', 'cut', 170, 80, 30, 2000, 100)`);
  assert.equal((await as("f", `select * from groups`)).rows.length, 0);
  assert.equal((await as("f", `select * from group_members`)).rows.length, 0);
  assert.equal(await rpc("f", "get_group_status", today), null);
});
await t("clients cannot write group tables or call internals", async () => {
  await fails(as("b", `insert into groups (name,badge,invite_code,creator_id) values ('x','y','ABCDEF','${U.b}')`), /permission denied/);
  await fails(as("b", `update group_members set group_id = group_id`), /permission denied/);
  await fails(as("b", `select public.evaluate_group('${g.id}', '${today}')`), /permission denied/);
  await fails(as("b", `select public.group_tier(1,1)`), /permission denied/);
});
await t("evaluate_group_bonus only acts for the caller", async () => {
  await fails(as("b", `select public.evaluate_group_bonus('${U.a}', '${today}')`), /not allowed/);
  assert.notEqual(await rpc("b", "evaluate_group_bonus", U.b, today), null);
});
await t("anon cannot call the RPCs", async () => {
  await db.exec(`set role anon`);
  try { await fails(db.query(`select public.create_group('x','y')`), /permission denied/); }
  finally { await db.exec(`reset role`); }
});
await t("tier thresholds", async () => {
  const tier = async (d, n) => Number((await db.query(`select public.group_tier($1,$2) t`, [d, n])).rows[0].t);
  assert.deepEqual([await tier(0, 2), await tier(1, 2), await tier(2, 2)], [0, 0, 30]);
  assert.deepEqual([await tier(1, 3), await tier(2, 3), await tier(3, 3)], [0, 10, 30]);
  assert.deepEqual([await tier(2, 4), await tier(3, 4), await tier(4, 4)], [0, 10, 30]);
  assert.deepEqual([await tier(3, 5), await tier(4, 5), await tier(5, 5)], [10, 20, 30]);
  assert.equal(await tier(0, 0), 0);
});
await t("creator leaves: ownership transfers; last member leaves: group deleted", async () => {
  await rpc("a", "leave_group");
  const s = await rpc("b", "get_group_status", today);
  assert.equal(s.group.creator_id, U.b); // oldest remaining member
  for (const u of ["b", "c", "e"]) await rpc(u, "leave_group");
  assert.equal(Number((await db.query(`select count(*) n from groups`)).rows[0].n), 0);
  assert.equal(Number((await db.query(`select count(*) n from group_daily_progress`)).rows[0].n), 0);
});
await t("realtime publication includes the group tables", async () => {
  const r = await db.query(`select tablename from pg_publication_tables where pubname='supabase_realtime' order by 1`);
  assert.deepEqual(r.rows.map((x) => x.tablename), ["group_daily_progress", "group_members"]);
});

console.log(`\n${passed} passed`);
