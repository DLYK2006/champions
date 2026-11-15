// Run: node --experimental-strip-types --test lib/groups/leaderboard.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { buildLeaderboard } from "./leaderboard.ts";

const s = (group_id, consistency_7d, full_bloom_streak = 0) => ({ group_id, consistency_7d, full_bloom_streak });
const names = (...ids) => Object.fromEntries(ids.map((id) => [id, `Group ${id}`]));

test("buildLeaderboard sorts by score, then streak, then group id", () => {
  const rows = buildLeaderboard([s("c", 50), s("b", 80, 1), s("a", 80, 3), s("d", 80, 3)], names("a", "b", "c", "d"), null);
  assert.deepEqual(rows.map((r) => r.group_name), ["Group a", "Group d", "Group b", "Group c"]);
  assert.deepEqual(rows.map((r) => r.rank), [1, 2, 3, 4]);
});

test("returns the top 10 plus the caller's own row outside the top 10, with its true rank", () => {
  const scores = Array.from({ length: 12 }, (_, i) => s(`g${String(i).padStart(2, "0")}`, 100 - i));
  const all = names(...scores.map((x) => x.group_id));
  const outside = buildLeaderboard(scores, all, "g11");
  assert.equal(outside.length, 11);
  assert.deepEqual(outside[10], { rank: 12, group_name: "Group g11", consistency_7d: 89, full_bloom_streak: 0, is_mine: true });
  const inside = buildLeaderboard(scores, all, "g02");
  assert.equal(inside.length, 10);
  assert.equal(inside.find((r) => r.is_mine).rank, 3);
});

test("drops groups missing from names (hidden groups) before ranking", () => {
  const rows = buildLeaderboard([s("a", 90), s("b", 80)], { b: "Group b" }, null);
  assert.deepEqual(rows.map((r) => [r.rank, r.group_name]), [[1, "Group b"]]);
});

test("no group: is_mine is false on every row", () => {
  const rows = buildLeaderboard([s("a", 90), s("b", 80)], names("a", "b"), null);
  assert.equal(rows.some((r) => r.is_mine), false);
});

test("an opted-out own group yields no own row", () => {
  const rows = buildLeaderboard([s("a", 90), s("me", 95)], { a: "Group a" }, "me");
  assert.deepEqual(rows.map((r) => r.group_name), ["Group a"]);
  assert.equal(rows.some((r) => r.is_mine), false);
});

test("empty scores give empty rows", () => {
  assert.deepEqual(buildLeaderboard([], {}, "me"), []);
});

test("rows expose only rank, name, score, streak and is_mine", () => {
  const [row] = buildLeaderboard([s("a", 90, 2)], names("a"), "a");
  assert.deepEqual(Object.keys(row).sort(), ["consistency_7d", "full_bloom_streak", "group_name", "is_mine", "rank"]);
});
