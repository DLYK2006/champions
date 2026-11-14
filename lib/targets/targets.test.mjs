// Run: node --test lib/targets/   (Node 22.18+ strips TypeScript types natively)
import test from "node:test";
import assert from "node:assert/strict";
import * as t from "./targets.ts";

test("age: adults only", () => {
  const r = t.validateAge(17);
  assert.equal(r.ok, false);
  assert.equal(r.error, t.ADULTS_ONLY_MESSAGE);
  assert.equal(t.validateAge(18).ok, true);
  assert.equal(t.validateAge(100).ok, true);
  assert.equal(t.validateAge(101).ok, false);
  assert.equal(t.validateAge(25.5).ok, false);
  assert.equal(t.validateAge(null).ok, false);
  assert.equal(t.validateAge(NaN).ok, false);
});

test("height and weight ranges", () => {
  assert.equal(t.validateHeight(119).ok, false);
  assert.equal(t.validateHeight(120).ok, true);
  assert.equal(t.validateHeight(230).ok, true);
  assert.equal(t.validateHeight(231).ok, false);
  assert.equal(t.validateWeight(29.9).ok, false);
  assert.equal(t.validateWeight(30).ok, true);
  assert.equal(t.validateWeight(300).ok, true);
  assert.equal(t.validateWeight(300.1).ok, false);
  assert.equal(t.validateWeight(undefined).ok, false);
});

test("body stats needs all three", () => {
  assert.equal(t.validateBodyStats({ height_cm: 175, weight_kg: 70, age: 21 }).valid, true);
  assert.equal(t.validateBodyStats({ height_cm: 175, weight_kg: null, age: 21 }).valid, false);
});

test("goal direction rules", () => {
  assert.equal(t.validateGoal(null, 70, null).ok, false);
  assert.equal(t.validateGoal("maintain", 70, null).ok, true);
  assert.equal(t.validateGoal("bulk", 70, 75).ok, true);
  assert.equal(t.validateGoal("bulk", 70, 70).ok, false);
  assert.equal(t.validateGoal("bulk", 70, 65).ok, false);
  assert.equal(t.validateGoal("cut", 70, 65).ok, true);
  assert.equal(t.validateGoal("cut", 70, 70).ok, false);
  assert.equal(t.validateGoal("cut", 70, 80).ok, false);
  assert.equal(t.validateGoal("cut", 70, null).ok, false);
  assert.equal(t.validateGoal("cut", 40, 29).ok, false); // below 30 kg
  assert.equal(t.validateGoal("bulk", 290, 301).ok, false); // above 300 kg
});

test("maintain forces target to current weight", () => {
  assert.equal(t.resolveTargetWeight("maintain", 70, 80), 70);
  assert.equal(t.resolveTargetWeight("cut", 70, 65), 65);
  assert.equal(t.resolveTargetWeight("cut", 70, null), null);
});

test("calories: block below 1200, warn below 1500, cap 5000", () => {
  assert.equal(t.validateCalories(1199).ok, false);
  const low = t.validateCalories(1200);
  assert.equal(low.ok, true);
  assert.ok(low.warning);
  assert.ok(t.validateCalories(1499).warning);
  const fine = t.validateCalories(1500);
  assert.equal(fine.ok, true);
  assert.equal(fine.warning, undefined);
  assert.equal(t.validateCalories(5000).ok, true);
  assert.equal(t.validateCalories(5001).ok, false);
  assert.equal(t.validateCalories(2000.5).ok, false);
  assert.equal(t.validateCalories(null).ok, false);
});

test("protein range and optional macros", () => {
  assert.equal(t.validateProtein(29).ok, false);
  assert.equal(t.validateProtein(30).ok, true);
  assert.equal(t.validateProtein(300).ok, true);
  assert.equal(t.validateProtein(301).ok, false);
  assert.equal(t.validateOptionalMacro("Carbs", null).ok, true);
  assert.equal(t.validateOptionalMacro("Carbs", "").ok, true);
  assert.equal(t.validateOptionalMacro("Carbs", 0).ok, true);
  assert.equal(t.validateOptionalMacro("Carbs", -1).ok, false);
  assert.equal(t.validateOptionalMacro("Fat", 60.5).ok, false);
});

test("every preset is valid, labeled, and never below the warning line", () => {
  assert.ok(t.PRESETS_DISCLAIMER.length > 0);
  for (const g of ["bulk", "cut", "maintain"]) assert.ok(t.presetsForGoal(g).length >= 1, `preset for ${g}`);
  for (const p of t.PRESETS) {
    const r = t.validateTargets(p);
    assert.equal(r.valid, true, p.id);
    assert.equal(r.fields.calorie_target.warning, undefined, `${p.id} should not trigger the low-calorie warning`);
    assert.ok(p.label && p.description);
  }
});

test("unit conversion round trips", () => {
  assert.equal(Math.round(t.cmFromFeetInches(5, 10)), 178);
  assert.deepEqual(t.feetInchesFromCm(177.8), { ft: 5, inch: 10 });
  assert.deepEqual(t.feetInchesFromCm(182.88), { ft: 6, inch: 0 });
  assert.deepEqual(t.feetInchesFromCm(182.0), { ft: 6, inch: 0 }); // 5'11.65" rounds up, never "5'12""
  assert.equal(t.round1(t.kgFromLb(154)), 69.9);
  assert.equal(Math.round(t.lbFromKg(70)), 154);
});

test("whole flow", () => {
  const good = { height_cm: 175, weight_kg: 70, age: 21, goal_type: "cut", target_weight_kg: 65,
    calorie_target: 1800, protein_target_g: 130, carbs_target_g: null, fat_target_g: null };
  assert.equal(t.validateOnboarding(good).valid, true);
  assert.equal(t.validateOnboarding({ ...good, age: 17 }).valid, false);
  assert.equal(t.validateOnboarding({ ...good, target_weight_kg: 75 }).valid, false);
  assert.equal(t.validateOnboarding({ ...good, calorie_target: 1000 }).valid, false);
});
