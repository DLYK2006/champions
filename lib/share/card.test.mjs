// Run: node --experimental-strip-types --test lib/share/card.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { cardLines, gardenStage } from "./card.ts";

const base = { username: "mia", avatar: {}, equipped: [], streak: 0, mealsToday: 0, goalMet: false, group: null };

test("card text contains personal counts only and omits group summary", () => {
  assert.deepEqual(cardLines({ ...base, streak: 12, mealsToday: 3, goalMet: true, group: { name: "Gym Rats", completion: 66.7 } }), [
    "12-day streak", "3 meals logged today | Goal met",
  ]);
  assert.deepEqual(cardLines({ ...base, mealsToday: 1 }), ["Starting a new streak", "1 meal logged today"]);
  assert.ok(!cardLines({ ...base, streak: 5, mealsToday: 2 }).join(" ").match(/kcal|calorie|protein|kg|lb|group/i));
});

test("garden stage thresholds match components/world/garden.tsx (PRD 10.3)", () => {
  assert.deepEqual([0, 24, 25, 59, 60, 79, 80, 99, 100].map(gardenStage), [0, 0, 1, 1, 2, 2, 3, 3, 4]);
});
