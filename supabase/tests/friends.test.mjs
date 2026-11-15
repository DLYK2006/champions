// Friends SQL tests (0006): applies every migration in an in-memory Postgres (PGlite) and checks mutual
// requests, search, privacy (a friend sees only username, streak and goal/logged days) and RLS.
// Run:  npm i --no-save @electric-sql/pglite  &&  node supabase/tests/friends.test.mjs
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

const U = { a: "00000000-0000-0000-0000-00000000000a", b: "00000000-0000-0000-0000-00000000000b",
            c: "00000000-0000-0000-0000-00000000000c", d: "00000000-0000-0000-0000-00000000000d" };
const names = { a: "alex_run", b: "alexa", c: "sam_lift", d: "50%_fun" };
for (const [k, id] of Object.entries(U)) {
  await db.exec(`insert into auth.users values ('${id}');
    insert into public.profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g, avatar)
    values ('${id}', '${names[k]}', 'maintain', 175, 70, 25, 2000, 100, '{"top":"x"}');`);
}
async function as(user, sql, params) {
  await db.exec(`select set_config('request.jwt.claim.sub', '${user ? U[user] : ""}', false); set role ${user === "anon" ? "anon" : "authenticated"};`);
  try { return await db.query(sql, params); } finally { await db.exec(`reset role;`); }
}
const rpc = async (user, fn, ...args) => (await as(user, `select public.${fn}(${args.map((_, i) => `$${i + 1}`).join(",")}) as r`, args)).rows[0].r;
const fails = async (p, msg) => { await assert.rejects(p, (e) => { assert.match(e.message, msg); return true; }); };
const ymd = (d) => d.toISOString().slice(0, 10);
const today = ymd(new Date());
const daysAgo = (n) => ymd(new Date(Date.now() - n * 86400000));
let passed = 0;
const t = async (name, fn) => { await fn(); passed++; console.log("ok -", name); };

await t("search: prefix, case-insensitive, needs 3 letters, never yourself", async () => {
  const r = await rpc("c", "search_users", "ALEX");
  assert.deepEqual(r.map((x) => x.username), ["alex_run", "alexa"]);
  assert.deepEqual(Object.keys(r[0]).sort(), ["relation", "user_id", "username"]);
  assert.ok(r.every((x) => x.relation === "none"));
  await fails(rpc("c", "search_users", "al"), /at least 3/);
  assert.deepEqual((await rpc("a", "search_users", "alex")).map((x) => x.username), ["alexa"]); // not "alex_run" (self)
});
await t("search treats % and _ literally", async () => {
  assert.deepEqual((await rpc("a", "search_users", "50%_")).map((x) => x.username), ["50%_fun"]);
  assert.deepEqual(await rpc("a", "search_users", "%%%"), []);
  assert.deepEqual(await rpc("a", "search_users", "ale_"), []); // "_" is not a wildcard
});
await t("send request: validation", async () => {
  await fails(rpc("a", "send_friend_request", U.a), /yourself/);
  await fails(rpc("a", "send_friend_request", "00000000-0000-0000-0000-0000000000ff"), /no one found/);
  await fails(rpc("a", "send_friend_request", null), /yourself/);
});
await t("a request is pending, shows as outgoing / incoming, and cannot be repeated", async () => {
  assert.deepEqual(await rpc("a", "send_friend_request", U.c), { user_id: U.c, status: "pending" });
  await fails(rpc("a", "send_friend_request", U.c), /already sent/);
  assert.equal((await rpc("a", "search_users", "sam"))[0].relation, "outgoing");
  assert.equal((await rpc("c", "search_users", "alex_"))[0].relation, "incoming");
  const la = await rpc("a", "list_friends");
  assert.deepEqual(la.outgoing.map((x) => x.username), ["sam_lift"]);
  assert.deepEqual(la.friends, []);
  assert.deepEqual((await rpc("c", "list_friends")).incoming.map((x) => x.username), ["alex_run"]);
});
await t("only the addressee can accept; the requester cannot accept their own request", async () => {
  await fails(rpc("a", "respond_friend_request", U.c, true), /no such request/);
  await fails(rpc("b", "respond_friend_request", U.a, true), /no such request/);
  assert.deepEqual(await rpc("c", "respond_friend_request", U.a, true), { user_id: U.a, status: "accepted" });
});
await t("accepted: both see each other as friends; asking again is refused", async () => {
  assert.deepEqual((await rpc("a", "list_friends")).friends.map((x) => x.username), ["sam_lift"]);
  assert.deepEqual((await rpc("c", "list_friends")).friends.map((x) => x.username), ["alex_run"]);
  await fails(rpc("a", "send_friend_request", U.c), /already friends/);
  await fails(rpc("c", "send_friend_request", U.a), /already friends/);
  assert.equal((await rpc("a", "search_users", "sam"))[0].relation, "friend");
});
await t("mutual: if they already asked you, sending a request accepts it", async () => {
  await rpc("b", "send_friend_request", U.a);
  assert.deepEqual(await rpc("a", "send_friend_request", U.b), { user_id: U.b, status: "accepted" });
  assert.equal((await rpc("a", "list_friends")).friends.length, 2);
});
await t("decline deletes quietly and the pair can ask again later", async () => {
  await rpc("d", "send_friend_request", U.a);
  assert.deepEqual(await rpc("a", "respond_friend_request", U.d, false), { user_id: U.d, status: "none" });
  assert.deepEqual((await rpc("a", "list_friends")).incoming, []);
  assert.deepEqual((await rpc("d", "list_friends")).outgoing, []); // requester sees nothing about a decline
  await rpc("d", "send_friend_request", U.a);
  await rpc("d", "remove_friend", U.a); // requester cancels
  await fails(rpc("d", "remove_friend", U.a), /not friends/);
});
await t("either side can remove a friendship", async () => {
  await rpc("b", "remove_friend", U.a);
  assert.deepEqual((await rpc("a", "list_friends")).friends.map((x) => x.username), ["sam_lift"]);
  assert.deepEqual((await rpc("b", "list_friends")).friends, []);
});

// ---- calendar and privacy
const day = (user, date, cal, goal) => db.query(
  `insert into daily_progress (user_id, date, meals_logged, total_calories, total_protein_g, total_carbs_g, total_fat_g, calorie_goal_completed, protein_goal_completed, personal_goal_completed)
   values ($1,$2,1,$3,90,300,80,$4,$4,$4)`, [U[user], date, cal, goal]);
await day("c", today, 2100, true);
await day("c", daysAgo(1), 900, false);
await day("c", daysAgo(2), 0, false);   // nothing logged: left out
await day("c", daysAgo(40), 2000, true); // outside the asked range
await db.query(`update profiles set streak = 4, last_meal_date = $2 where id = $1`, [U.c, today]);

await t("get_friend_calendar returns only date + status, plus username and streak", async () => {
  const r = await rpc("a", "get_friend_calendar", U.c, daysAgo(6), today, today);
  assert.deepEqual(Object.keys(r).sort(), ["days", "streak", "user_id", "username"]);
  assert.equal(r.username, "sam_lift");
  assert.equal(r.streak, 4);
  assert.deepEqual(r.days, [{ date: daysAgo(1), status: "logged" }, { date: today, status: "goal" }]);
  for (const d of r.days) assert.deepEqual(Object.keys(d).sort(), ["date", "status"]);
});
await t("privacy: no calories, macros, weight, targets, avatar or group anywhere in the responses", async () => {
  const blob = JSON.stringify([await rpc("a", "get_friend_calendar", U.c, daysAgo(6), today, today),
                               await rpc("a", "list_friends"), await rpc("a", "search_users", "sam")]);
  for (const bad of ["calorie", "protein", "carbs", "fat", "weight", "height", "target", "avatar", "group", "2100", "equipped", "coin"]) {
    assert.ok(!blob.toLowerCase().includes(bad), `response mentions ${bad}`);
  }
});
await t("streak goes to 0 once the last qualifying meal was before yesterday", async () => {
  await db.query(`update profiles set last_meal_date = $2 where id = $1`, [U.c, daysAgo(2)]);
  assert.equal((await rpc("a", "get_friend_calendar", U.c, daysAgo(6), today, today)).streak, 0);
  assert.equal((await rpc("a", "list_friends", today)).friends[0].streak, 0);
  await db.query(`update profiles set last_meal_date = $2 where id = $1`, [U.c, daysAgo(1)]);
  assert.equal((await rpc("a", "list_friends", today)).friends[0].streak, 4);
});
await t("calendar is refused for non-friends, pending requests and strangers", async () => {
  await fails(rpc("b", "get_friend_calendar", U.c, daysAgo(6), today), /not friends/);   // b: removed
  await rpc("d", "send_friend_request", U.c);
  await fails(rpc("d", "get_friend_calendar", U.c, daysAgo(6), today), /not friends/);   // pending only
  await fails(rpc("c", "get_friend_calendar", U.d, daysAgo(6), today), /not friends/);
});
await t("p_today is clamped to UTC today +/- 1 (null means UTC today)", async () => {
  await fails(rpc("a", "list_friends", daysAgo(5)), /bad date/);
  await fails(rpc("a", "get_friend_calendar", U.c, daysAgo(6), today, "2099-01-01"), /bad date/);
  await rpc("a", "list_friends", daysAgo(1));
  await rpc("a", "list_friends", ymd(new Date(Date.now() + 86400000)));
  assert.ok((await rpc("a", "get_friend_calendar", U.c, daysAgo(6), today)).days.length >= 1); // null p_today
});
await t("calendar range is validated", async () => {
  await fails(rpc("a", "get_friend_calendar", U.c, today, daysAgo(3)), /bad date range/);
  await fails(rpc("a", "get_friend_calendar", U.c, daysAgo(100), today), /too long/);
});
await t("RLS: a friendship table read shows only your own rows; clients cannot write it", async () => {
  const mine = await as("d", `select requester_id, addressee_id from friendships`);
  assert.ok(mine.rows.every((r) => r.requester_id === U.d || r.addressee_id === U.d));
  assert.ok(mine.rows.length >= 1);
  await assert.rejects(as("d", `insert into friendships (requester_id, addressee_id, status) values ($1,$2,'accepted')`, [U.d, U.a]), /permission denied/);
  await assert.rejects(as("a", `update friendships set status = 'accepted'`), /permission denied/);
  await assert.rejects(as("a", `delete from friendships`), /permission denied/);
});
await t("friends still cannot read each other's daily_progress or profiles directly", async () => {
  assert.equal((await as("a", `select * from daily_progress where user_id = $1`, [U.c])).rows.length, 0);
  assert.equal((await as("a", `select * from profiles where id = $1`, [U.c])).rows.length, 0);
});
await t("signed-out callers are refused", async () => {
  await assert.rejects(as("anon", `select public.list_friends()`), /permission denied/);
  await assert.rejects(as("anon", `select public.search_users('abc')`), /permission denied/);
  await fails(rpc(null, "list_friends"), /not signed in/);
});
await t("pending requests are capped at 20 outgoing", async () => {
  for (let i = 0; i < 20; i++) {
    const id = `00000000-0000-0000-0000-0000000001${String(i).padStart(2, "0")}`;
    await db.exec(`insert into auth.users values ('${id}'); insert into public.profiles (id, username, goal_type, height_cm, weight_kg, age, calorie_target, protein_target_g) values ('${id}', 'bulk_${i}', 'maintain', 175, 70, 25, 2000, 100);`);
    U[`z${i}`] = id;
  }
  for (let i = 0; i < 19; i++) await rpc("b", "send_friend_request", U[`z${i}`]);
  await rpc("b", "send_friend_request", U.z19); // 20th pending: fine
  await fails(rpc("b", "send_friend_request", U.d), /too many pending/);
});
await t("deleting a profile removes its friendships", async () => {
  await db.query(`delete from profiles where id = $1`, [U.z0]);
  assert.equal((await db.query(`select 1 from friendships where addressee_id = $1`, [U.z0])).rows.length, 0);
});

console.log(`\n${passed} friends checks passed`);
