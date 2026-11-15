// Run: node lib/settings/settings.test.mjs   (Node 22.18+ strips TypeScript types natively)
// settings.ts imports lib/targets without a file extension (as TypeScript requires), so register a tiny resolver
// that adds ".ts" to extensionless relative imports.
import { register } from "node:module";
register("data:text/javascript," + encodeURIComponent(
  "export async function resolve(s, c, next) {" +
  " return next(s.startsWith('.') && !s.split('/').pop().includes('.') ? s + '.ts' : s, c); }"));
const test = (await import("node:test")).default;
const assert = (await import("node:assert/strict")).default;
const s = await import("./settings.ts");

const base = {
  username: "alex_run", goal_type: "maintain", height_cm: 175, weight_kg: 70, age: 25, target_weight_kg: 70,
  calorie_target: 2200, protein_target_g: 120, carbs_target_g: null, fat_target_g: null,
  unit_preference: "metric", hide_status_from_group: false, notify_meal_reminders: false, notify_group_alerts: false,
};

test("toSettings normalises numerics and defaults the preferences", () => {
  const r = s.toSettings({ ...base, height_cm: "175.5", carbs_target_g: "250", unit_preference: "weird", hide_status_from_group: null });
  assert.equal(r.height_cm, 175.5);
  assert.equal(r.carbs_target_g, 250);
  assert.equal(r.unit_preference, "metric");
  assert.equal(r.hide_status_from_group, false);
});

test("a valid profile passes", () => {
  assert.equal(s.validateSettings(base).valid, true);
});

test("same rules as onboarding: adults only, ranges, bulk/cut target weight, calories floor", () => {
  assert.match(s.validateSettings({ ...base, age: 17 }).fields.age.error, /18/);
  assert.equal(s.validateSettings({ ...base, height_cm: 300 }).valid, false);
  assert.match(s.validateSettings({ ...base, goal_type: "bulk", target_weight_kg: 65 }).fields.goal_type.error, /above/);
  assert.match(s.validateSettings({ ...base, goal_type: "cut", target_weight_kg: 75 }).fields.goal_type.error, /below/);
  assert.equal(s.validateSettings({ ...base, calorie_target: 1100 }).valid, false);
  const low = s.validateSettings({ ...base, calorie_target: 1300 });
  assert.equal(low.valid, true);
  assert.ok(low.fields.calorie_target.warning, "low target warns but is allowed");
});

test("username rules", () => {
  assert.equal(s.validateSettings({ ...base, username: "ab" }).valid, false);
  assert.equal(s.validateSettings({ ...base, username: "bad name!" }).valid, false);
  assert.equal(s.validateSettings({ ...base, username: "  ok_name " }).valid, true); // trimmed
});

test("Maintain forces target weight to current weight", () => {
  assert.equal(s.normalizeSettings({ ...base, goal_type: "maintain", weight_kg: 72, target_weight_kg: 60 }).target_weight_kg, 72);
  assert.equal(s.normalizeSettings({ ...base, goal_type: "bulk", target_weight_kg: 80 }).target_weight_kg, 80);
});

test("toggles and units must be the right type", () => {
  assert.equal(s.validateSettings({ ...base, unit_preference: "stone" }).valid, false);
  assert.equal(s.validateSettings({ ...base, notify_group_alerts: "yes" }).valid, false);
});

test("SettingsValidationError carries the fields and the first message", () => {
  const c = s.validateSettings({ ...base, age: 17 });
  const e = new s.SettingsValidationError(c.fields);
  assert.match(e.message, /18/);
  assert.equal(e.fields.age.ok, false);
});

test("profile-updated event reaches listeners and unsubscribes", () => {
  const target = new EventTarget();
  globalThis.window = target; // the helpers use window.addEventListener / dispatchEvent
  let n = 0;
  const off = s.onProfileUpdated(() => n++);
  s.notifyProfileUpdated();
  off();
  s.notifyProfileUpdated();
  assert.equal(n, 1);
  delete globalThis.window;
});
