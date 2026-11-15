// Run: node --experimental-strip-types --test lib/targets/recommend.test.mjs   (Node 22.18+ needs no flag)
import test from "node:test";
import assert from "node:assert/strict";
import { recommendTargets } from "./recommend.ts";

const base = { weight_kg: 70, height_cm: 175, age: 25, activity: "moderate" };

test("Mifflin-St Jeor (sex-neutral) x activity, adjusted by goal", () => {
  const m = recommendTargets({ ...base, goal: "maintain" });
  assert.equal(m.bmr, 1591); // 700 + 1093.75 - 125 - 78 = 1590.75
  assert.equal(m.tdee, 2466); // x 1.55 = 2465.66
  assert.equal(m.calorie_target, 2470);
  assert.equal(recommendTargets({ ...base, goal: "bulk" }).calorie_target, 2710); // +10% = 2712.2
  assert.equal(recommendTargets({ ...base, goal: "cut" }).calorie_target, 2100); // -15% = 2095.8
});

test("protein by goal and body weight", () => {
  assert.equal(recommendTargets({ ...base, goal: "maintain" }).protein_target_g, 84); // 1.2 g/kg
  assert.equal(recommendTargets({ ...base, goal: "bulk" }).protein_target_g, 112); // 1.6 g/kg
});

test("different people get different targets", () => {
  const small = recommendTargets({ weight_kg: 50, height_cm: 155, age: 19, goal: "bulk", activity: "sedentary" });
  const big = recommendTargets({ weight_kg: 110, height_cm: 190, age: 45, goal: "bulk", activity: "very" });
  assert.ok(big.calorie_target - small.calorie_target > 1000);
});

test("never an unsafe deficit: floors at 1500 kcal and at BMR", () => {
  const tiny = recommendTargets({ weight_kg: 40, height_cm: 150, age: 70, goal: "cut", activity: "sedentary" });
  assert.ok(tiny.calorie_target >= 1500);
  assert.ok(tiny.calorie_target >= tiny.bmr);
});

test("macros add up to roughly the calorie target", () => {
  const r = recommendTargets({ ...base, goal: "bulk" });
  const kcal = r.protein_target_g * 4 + r.carbs_target_g * 4 + r.fat_target_g * 9;
  assert.ok(Math.abs(kcal - r.calorie_target) < 10);
});
