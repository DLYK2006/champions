// Run: node --test lib/home/   (Node 22.18+ strips TypeScript types natively)
import test from "node:test";
import assert from "node:assert/strict";
import * as h from "./home.ts";

const row = {
  id: "u1", username: "alex", goal_type: "cut", height_cm: "175.5", weight_kg: 70, age: 25,
  target_weight_kg: "65", calorie_target: 2000, protein_target_g: 100, carbs_target_g: null, fat_target_g: null,
  avatar: { skinColor: "d08b5b", top: "bun", hairColor: "724133", eyes: "wink", mouth: "serious", clothing: "overall" },
  equipped: ["hoodie", "crown"], coin_balance: 80, streak: 3,
};

test("toProfile maps a full row and normalises numerics", () => {
  const p = h.toProfile(row);
  assert.equal(p.height_cm, 175.5);
  assert.equal(p.target_weight_kg, 65);
  assert.equal(p.carbs_target_g, null);
  assert.deepEqual(p.equipped, ["hoodie", "crown"]);
  assert.equal(p.coin_balance, 80);
  assert.equal(p.avatar.top, "bun");
  assert.equal(p.goal_type, "cut");
});

test("empty or partial avatar falls back so the renderer always gets all six keys", () => {
  assert.deepEqual(h.toProfile({ ...row, avatar: {} }).avatar, h.FALLBACK_AVATAR);
  assert.deepEqual(h.toProfile({ ...row, avatar: null }).avatar, h.FALLBACK_AVATAR);
  const partial = h.toProfile({ ...row, avatar: { top: "curly", eyes: "" } }).avatar;
  assert.equal(partial.top, "curly");
  assert.equal(partial.eyes, h.FALLBACK_AVATAR.eyes);
  assert.equal(Object.keys(partial).length, 6);
});

test("bad equipped / numbers do not crash", () => {
  const p = h.toProfile({ ...row, equipped: null, coin_balance: undefined, streak: "x" });
  assert.deepEqual(p.equipped, []);
  assert.equal(p.coin_balance, 0);
  assert.equal(p.streak, 0);
  assert.deepEqual(h.toProfile({ ...row, equipped: ["a", 1, null, "b"] }).equipped, ["a", "b"]);
});

test("no daily_progress row means an empty day, not an error", () => {
  const p = h.toProgress(null, "2026-11-14");
  assert.deepEqual(p, h.emptyProgress("2026-11-14"));
  assert.equal(p.meals_logged, 0);
  assert.equal(p.personal_goal_completed, false);
  assert.deepEqual(h.toProgress(undefined, "2026-11-14"), p);
});

test("toProgress maps a row and normalises numeric strings", () => {
  const p = h.toProgress({
    date: "2026-11-14", meals_logged: 2, total_calories: "1800.5", total_protein_g: "110", total_carbs_g: 200,
    total_fat_g: "60", calorie_goal_completed: true, protein_goal_completed: false, personal_goal_completed: false,
  }, "2026-11-13");
  assert.equal(p.date, "2026-11-14");
  assert.equal(p.total_calories, 1800.5);
  assert.equal(p.total_protein_g, 110);
  assert.equal(p.calorie_goal_completed, true);
  assert.equal(p.personal_goal_completed, false);
});

test("goal flags are strictly booleans", () => {
  const p = h.toProgress({ calorie_goal_completed: "true", protein_goal_completed: 1, personal_goal_completed: null }, "d");
  assert.deepEqual([p.calorie_goal_completed, p.protein_goal_completed, p.personal_goal_completed], [false, false, false]);
});

test("streak resets to 0 once the last qualifying meal is before yesterday", () => {
  const withLast = (d) => ({ ...row, streak: 5, last_meal_date: d });
  assert.equal(h.toProfile(withLast("2026-11-14"), "2026-11-14").streak, 5); // today
  assert.equal(h.toProfile(withLast("2026-11-13"), "2026-11-14").streak, 5); // yesterday still counts
  assert.equal(h.toProfile(withLast("2026-11-12"), "2026-11-14").streak, 0); // missed a day
  assert.equal(h.toProfile({ ...row, streak: 5, last_meal_date: null }, "2026-11-14").streak, 0);
  assert.equal(h.toProfile(withLast("2026-11-12")).streak, 5); // no date given: raw value
});

test("previousDate crosses month and year boundaries", () => {
  assert.equal(h.previousDate("2026-03-01"), "2026-02-28");
  assert.equal(h.previousDate("2027-01-01"), "2026-12-31");
});

test("toProfile keeps the optional starter wardrobe and ignores junk", () => {
  const a = h.toProfile({ ...row, avatar: { ...row.avatar, hat: "moss-beanie", pants: "indigo-trousers", shoes: "" } }).avatar;
  assert.equal(a.hat, "moss-beanie");
  assert.equal(a.pants, "indigo-trousers");
  assert.equal("shoes" in a, false);
  assert.equal("hat" in h.toProfile({ ...row, avatar: { hat: 5 } }).avatar, false);
  assert.equal("hat" in h.toProfile(row).avatar, false); // old avatars stay six-key
});
