// Group leaderboard SQL tests (0012): applies every migration in an in-memory Postgres (PGlite) and checks the
// 7-day score, the full-bloom streak, who is excluded, ranking, top-10 + own row, opt-out and permissions.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/group_leaderboard.test.mjs
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
console.log("migrations applied");

let seq = 0;
const ymd = (d) => d.toISOString().slice(0, 10);
const daysAgo = (n) => ymd(new Date(Date.now() - n * 86400000));
async function newUser() {
  const { rows } = await db.query(`select gen_random_uuid() as id`);
  const id = rows[0].id;
  await db.query(`insert into auth.users values ($1)`, [id]);
  await db.query(
    `insert into public.profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g, avatar)
     values ($1, $2, 'maintain', 175, 70, 25, 2000, 100, '{"top":"x"}')`, [id, `user_${++seq}`]);
  return id;
}
// rows: [daysAgo, eligible, completed, pct, tier]. members: how many people are in the group right now.
async function seedGroup(name, rows, members = 2) {
  const users = [];
  for (let i = 0; i < members; i++) users.push(await newUser());
  const code = Math.random().toString(36).slice(2, 8).toUpperCase().padEnd(6, "X");
  const { rows: g } = await db.query(
    `insert into public.groups (name, badge, invite_code, creator_id) values ($1, 'leaf', $2, $3) returning id`, [name, code, users[0]]);
  for (const u of users) await db.query(`insert into public.group_members (group_id, user_id) values ($1, $2)`, [g[0].id, u]);
  for (const [ago, elig, done, pct, tier] of rows)
    await db.query(
      `insert into public.group_daily_progress (group_id, date, eligible_member_count, completed_member_count, completion_percentage, bonus_tier)
       values ($1, $2, $3, $4, $5, $6)`, [g[0].id, daysAgo(ago), elig, done, pct, tier]);
  return { id: g[0].id, name, user: users[0], users };
}
const wipe = () => db.exec(`delete from public.groups`);
async function as(user, sql, params) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${user && user !== "anon" ? user : ""}', false); set role ${user === "anon" ? "anon" : "authenticated"};`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role;`); }
}
const rpc = async (user, fn, ...args) => (await as(user, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as r`, args)).rows[0].r;
const fails = async (p, msg) => { await assert.rejects(p, (e) => { assert.match(e.message, msg); return true; }); };
let passed = 0;
const t = async (name, fn) => { await wipe(); await fn(); passed++; console.log("ok -", name); };

await t("scores average completion over 7 days and count missing days as 0", async () => {
  // Rows on days 0, 1, 2 only: the group's first 2+ member day is day 2, so just those 3 days count.
  const a = await seedGroup("Steady", [[0, 2, 2, 100, 30], [1, 2, 2, 100, 30], [2, 2, 1, 50, 0]]);
  // First day 4, rows on 4 and 0; days 3, 2, 1 are missing and count 0: (100 + 0 + 0 + 0 + 100) / 5 = 40.
  await seedGroup("Gappy", [[4, 2, 2, 100, 30], [0, 2, 2, 100, 30]]);
  const rows = await rpc(a.user, "get_group_leaderboard");
  const by = Object.fromEntries(rows.map((r) => [r.group_name, r]));
  assert.equal(Number(by.Steady.consistency_7d), 83.3);
  assert.equal(Number(by.Gappy.consistency_7d), 40);
});

await t("a group whose last rows are older than 7 days scores 0, not an error", async () => {
  const a = await seedGroup("Old", [[20, 2, 2, 100, 30]]);
  const rows = await rpc(a.user, "get_group_leaderboard");
  assert.equal(rows.length, 1);
  assert.equal(Number(rows[0].consistency_7d), 0);
  assert.equal(rows[0].full_bloom_streak, 0);
});

await t("streak counts consecutive tier-30 days ending today or yesterday", async () => {
  const today2 = await seedGroup("Today", [[0, 2, 2, 100, 30], [1, 2, 2, 100, 30], [2, 2, 1, 50, 0]]);
  await seedGroup("Yesterday", [[1, 2, 2, 100, 30], [2, 2, 2, 100, 30]]);
  await seedGroup("Broken", [[0, 2, 2, 100, 30], [2, 2, 2, 100, 30]]);
  const by = Object.fromEntries((await rpc(today2.user, "get_group_leaderboard")).map((r) => [r.group_name, r]));
  assert.equal(by.Today.full_bloom_streak, 2);
  assert.equal(by.Yesterday.full_bloom_streak, 2);
  assert.equal(by.Broken.full_bloom_streak, 1);
});

await t("groups under 2 members are excluded, including one that dropped from 2 to 1", async () => {
  const solo = await seedGroup("Solo", [[0, 1, 1, 100, 0]], 1);
  const dropped = await seedGroup("Dropped", [[1, 2, 2, 100, 30], [0, 1, 1, 100, 0]], 2);
  await db.query(`delete from public.group_members where user_id = $1`, [dropped.users[1]]);
  const ok = await seedGroup("Pair", [[0, 2, 2, 100, 30]]);
  const names = (await rpc(ok.user, "get_group_leaderboard")).map((r) => r.group_name);
  assert.deepEqual(names, ["Pair"]);
  assert.deepEqual((await rpc(solo.user, "get_group_leaderboard")).map((r) => r.group_name), ["Pair"]);
});

await t("ties rank by group_id so the order is stable", async () => {
  const a = await seedGroup("Twin A", [[0, 2, 2, 100, 30]]);
  const b = await seedGroup("Twin B", [[0, 2, 2, 100, 30]]);
  const rows = await rpc(a.user, "get_group_leaderboard");
  const expected = [a, b].sort((x, y) => (x.id < y.id ? -1 : 1)).map((g) => g.name);
  assert.deepEqual(rows.map((r) => r.group_name), expected);
  assert.deepEqual(rows.map((r) => r.rank), [1, 2]);
});

await t("top 10 plus the caller's own group when it is outside the top 10", async () => {
  const gs = [];
  for (let i = 0; i < 12; i++) gs.push(await seedGroup(`G${String(i).padStart(2, "0")}`, [[0, 2, 2, 100 - i, 0]]));
  const outside = await rpc(gs[11].user, "get_group_leaderboard");
  assert.equal(outside.length, 11);
  assert.equal(outside[10].group_name, "G11");
  assert.equal(outside[10].rank, 12);
  assert.equal(outside[10].is_mine, true);
  assert.equal(outside.filter((r) => r.is_mine).length, 1);
  const inside = await rpc(gs[2].user, "get_group_leaderboard");
  assert.equal(inside.length, 10);
  assert.equal(inside.find((r) => r.is_mine).rank, 3);
});

await t("a caller with no group sees the top 10 and no own row", async () => {
  await seedGroup("Only", [[0, 2, 2, 100, 30]]);
  const loner = await newUser();
  const rows = await rpc(loner, "get_group_leaderboard");
  assert.equal(rows.length, 1);
  assert.equal(rows.some((r) => r.is_mine), false);
});

await t("rows carry no ids or member data", async () => {
  const a = await seedGroup("Clean", [[0, 2, 2, 100, 30]]);
  const [row] = await rpc(a.user, "get_group_leaderboard");
  assert.deepEqual(Object.keys(row).sort(), ["consistency_7d", "full_bloom_streak", "group_name", "is_mine", "rank"]);
});

await t("an opted-out group is absent for everyone, including its own members", async () => {
  const hidden = await seedGroup("Hidden", [[0, 2, 2, 100, 30]]);
  const shown = await seedGroup("Shown", [[0, 2, 1, 50, 0]]);
  await rpc(hidden.user, "set_group_leaderboard_visible", false);
  assert.deepEqual((await rpc(shown.user, "get_group_leaderboard")).map((r) => r.group_name), ["Shown"]);
  assert.deepEqual((await rpc(hidden.user, "get_group_leaderboard")).map((r) => r.group_name), ["Shown"]);
  assert.equal((await rpc(hidden.user, "get_group_leaderboard")).some((r) => r.is_mine), false);
});

await t("get_group_names returns only visible groups", async () => {
  const a = await seedGroup("Visible", [[0, 2, 2, 100, 30]]);
  const b = await seedGroup("Quiet", [[0, 2, 2, 100, 30]]);
  await rpc(b.user, "set_group_leaderboard_visible", false);
  const names = await rpc(a.user, "get_group_names", [a.id, b.id]);
  assert.deepEqual(names, { [a.id]: "Visible" });
});

await t("get_group_names omits groups with fewer than 2 members now (the Databricks path ranks by id only)", async () => {
  const a = await seedGroup("Pair", [[0, 2, 2, 100, 30]]);
  const dropped = await seedGroup("Dropped", [[1, 2, 2, 100, 30]], 2);
  await db.query(`delete from public.group_members where user_id = $1`, [dropped.users[1]]);
  assert.deepEqual(await rpc(a.user, "get_group_names", [a.id, dropped.id]), { [a.id]: "Pair" });
});

await t("set_group_leaderboard_visible needs a group and flips the flag", async () => {
  const a = await seedGroup("Flip", [[0, 2, 2, 100, 30]]);
  await rpc(a.user, "set_group_leaderboard_visible", false);
  assert.equal((await db.query(`select leaderboard_visible v from public.groups where id = $1`, [a.id])).rows[0].v, false);
  await rpc(a.users[1], "set_group_leaderboard_visible", true);
  assert.equal((await db.query(`select leaderboard_visible v from public.groups where id = $1`, [a.id])).rows[0].v, true);
  await fails(rpc(await newUser(), "set_group_leaderboard_visible", false), /not in a group/);
});

await t("anon cannot call any leaderboard function; internals are not callable by signed-in users", async () => {
  await fails(rpc("anon", "get_group_leaderboard"), /permission denied/);
  await fails(rpc("anon", "get_group_names", []), /permission denied/);
  await fails(rpc("anon", "set_group_leaderboard_visible", true), /permission denied/);
  const u = await newUser();
  await fails(rpc(u, "group_scores", null), /permission denied/);
});

console.log(`\n${passed} passed`);
