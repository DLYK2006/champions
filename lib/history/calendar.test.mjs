// Run: node --experimental-strip-types --test lib/history/calendar.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { currentStreak, dayStatus, monthCells } from "./calendar.ts";

test("streak survives until the end of the day after the last meal", () => {
  assert.equal(currentStreak(5, "2026-11-14", "2026-11-14"), 5);
  assert.equal(currentStreak(5, "2026-11-13", "2026-11-14"), 5);
  assert.equal(currentStreak(5, "2026-11-12", "2026-11-14"), 0);
  assert.equal(currentStreak(3, "2026-11-30", "2026-12-01"), 3); // across a month boundary
  assert.equal(currentStreak(3, null, "2026-11-14"), 0);
});

test("day status", () => {
  assert.equal(dayStatus(undefined), "none");
  assert.equal(dayStatus({ total_calories: 0, personal_goal_completed: false }), "none");
  assert.equal(dayStatus({ total_calories: 400, personal_goal_completed: false }), "logged");
  assert.equal(dayStatus({ total_calories: 2000, personal_goal_completed: true }), "goal");
});

test("month grid starts on Monday", () => {
  const nov = monthCells(2026, 10); // Nov 1 2026 is a Sunday -> 6 leading blanks
  assert.equal(nov.filter((c) => c === null).length, 6);
  assert.equal(nov.length, 6 + 30);
  assert.equal(nov[6], "2026-11-01");
  assert.equal(monthCells(2026, 1).at(-1), "2026-02-28");
});
