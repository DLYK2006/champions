// Run: node --experimental-strip-types --test lib/celebrate/celebration.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { celebrationFor } from "./celebration.ts";

const p = (bonus_tier) => ({ group_id: "g1", date: "2026-11-15", bonus_tier });

test("nothing below 60% or without a group", () => {
  assert.equal(celebrationFor(null, true, 0), null);
  assert.equal(celebrationFor(p(0), true, 0), null);
});

test("full bloom: dialog only for members who were paid", () => {
  const c = celebrationFor(p(30), true, 0);
  assert.equal(c.dialog, true);
  assert.equal(c.coins, 30);
  assert.equal(c.title, "Your whole group made it!");
  assert.equal(c.key, "digin:celebrated:g1:2026-11-15");
  assert.equal(celebrationFor(p(30), false, 0).dialog, false);
});

test("dialog text names the group and leaves the coin number to the reward pill", () => {
  const c = celebrationFor(p(30), true, 0, "Gym Rats");
  assert.equal(c.description, "Everyone in Gym Rats reached their goal today. Your garden is in full bloom.");
  assert.ok(!/\d/.test(c.description));
  assert.match(celebrationFor(p(30), true, 0).description, /^Everyone in your group/);
});

test("smaller tiers are a gentle line, never a dialog, never blame", () => {
  const paid = celebrationFor(p(10), true, 0);
  assert.deepEqual([paid.dialog, paid.line], [false, "The garden is growing · +10 for you"]);
  const unpaid = celebrationFor(p(20), false, 0);
  assert.deepEqual([unpaid.coins, unpaid.line], [0, "The garden is growing"]);
});

test("once per tier: an already-shown tier stays quiet, a higher one shows", () => {
  assert.equal(celebrationFor(p(20), true, 20), null);
  assert.equal(celebrationFor(p(10), true, 20), null);
  assert.equal(celebrationFor(p(30), true, 20).tier, 30);
});
