// Onboarding logic: ranges, unit conversion, labeled presets, validators.
// Pure functions, no React or Supabase. Owner: @joshuatsou123. Rules: docs/BUILD_PLAN.md.
import type { GoalType } from "../../types/index";

// ---------- ranges (BUILD_PLAN "Onboarding input ranges"; mirrors profiles CHECKs) ----------
export const RANGES = {
  height_cm: { min: 120, max: 230 },
  weight_kg: { min: 30, max: 300 },
  age: { min: 18, max: 100 },
  target_weight_kg: { min: 30, max: 300 },
  calories: { min: 1200, max: 5000, warnBelow: 1500 },
  protein_g: { min: 30, max: 300 },
} as const;

export const ADULTS_ONLY_MESSAGE = "DIG IN is for adults (18+) for now";
export const LOW_CALORIE_WARNING =
  "This target is quite low. DIG IN isn't medical advice; consider talking to a professional before eating this little.";

export type Units = "metric" | "imperial";

// ---------- unit conversion (storage is always metric) ----------
const CM_PER_INCH = 2.54;
const KG_PER_LB = 0.45359237;

export const cmFromFeetInches = (ft: number, inch: number) => (ft * 12 + inch) * CM_PER_INCH;
export const feetInchesFromCm = (cm: number) => {
  const totalInches = cm / CM_PER_INCH;
  let ft = Math.floor(totalInches / 12);
  let inch = Math.round(totalInches - ft * 12);
  if (inch === 12) { ft += 1; inch = 0; }
  return { ft, inch };
};
export const kgFromLb = (lb: number) => lb * KG_PER_LB;
export const lbFromKg = (kg: number) => kg / KG_PER_LB;
export const round1 = (n: number) => Math.round(n * 10) / 10;

// ---------- result shape ----------
export interface FieldResult { ok: boolean; error?: string; warning?: string }
const ok = (warning?: string): FieldResult => (warning ? { ok: true, warning } : { ok: true });
const bad = (error: string): FieldResult => ({ ok: false, error });

const isNum = (v: unknown): v is number => typeof v === "number" && Number.isFinite(v);

function inRange(label: string, v: unknown, r: { min: number; max: number }, unit: string): FieldResult {
  if (!isNum(v)) return bad(`Enter your ${label}`);
  if (v < r.min || v > r.max) return bad(`${label[0].toUpperCase()}${label.slice(1)} must be between ${r.min} and ${r.max} ${unit}`.trim());
  return ok();
}

// ---------- screen 1: body stats (all values metric) ----------
export interface BodyStats { height_cm: number | null; weight_kg: number | null; age: number | null }

export function validateAge(age: unknown): FieldResult {
  if (!isNum(age)) return bad("Enter your age");
  if (!Number.isInteger(age)) return bad("Age must be a whole number");
  if (age < RANGES.age.min) return bad(ADULTS_ONLY_MESSAGE);
  if (age > RANGES.age.max) return bad(`Age must be between ${RANGES.age.min} and ${RANGES.age.max}`);
  return ok();
}
export const validateHeight = (cm: unknown) => inRange("height", cm, RANGES.height_cm, "cm");
export const validateWeight = (kg: unknown) => inRange("weight", kg, RANGES.weight_kg, "kg");

export function validateBodyStats(s: BodyStats) {
  const fields = { height_cm: validateHeight(s.height_cm), weight_kg: validateWeight(s.weight_kg), age: validateAge(s.age) };
  return { valid: Object.values(fields).every((f) => f.ok), fields };
}

// ---------- screen 2: goal and target weight ----------
export function validateGoal(goal: GoalType | null, weight_kg: number | null, target_weight_kg: number | null): FieldResult {
  if (!goal) return bad("Pick a goal");
  if (goal === "maintain") return ok(); // target is forced to current weight
  if (!isNum(target_weight_kg)) return bad("Enter a target weight");
  const range = inRange("target weight", target_weight_kg, RANGES.target_weight_kg, "kg");
  if (!range.ok) return range;
  if (isNum(weight_kg)) {
    if (goal === "bulk" && target_weight_kg <= weight_kg) return bad("For Bulk, target weight must be above your current weight");
    if (goal === "cut" && target_weight_kg >= weight_kg) return bad("For Cut, target weight must be below your current weight");
  }
  return ok();
}

// Maintain locks the box to current weight; switching to Maintain clears an entered target (PRD 4.2).
export const resolveTargetWeight = (goal: GoalType, weight_kg: number, entered: number | null) =>
  goal === "maintain" ? weight_kg : entered;

// ---------- screen 3: nutrition targets ----------
export interface Targets { calorie_target: number | null; protein_target_g: number | null; carbs_target_g: number | null; fat_target_g: number | null }

export function validateCalories(kcal: unknown): FieldResult {
  if (!isNum(kcal)) return bad("Enter a daily calorie target");
  if (!Number.isInteger(kcal)) return bad("Calories must be a whole number");
  if (kcal < RANGES.calories.min) return bad(`Calorie target can't go below ${RANGES.calories.min} kcal`);
  if (kcal > RANGES.calories.max) return bad(`Calorie target can't be above ${RANGES.calories.max} kcal`);
  return ok(kcal < RANGES.calories.warnBelow ? LOW_CALORIE_WARNING : undefined);
}
export function validateProtein(g: unknown): FieldResult {
  if (!isNum(g)) return bad("Enter a daily protein target");
  if (!Number.isInteger(g)) return bad("Protein must be a whole number");
  return inRange("protein target", g, RANGES.protein_g, "g");
}
export function validateOptionalMacro(label: string, g: unknown): FieldResult {
  if (g === null || g === undefined || g === "") return ok();
  if (!isNum(g) || !Number.isInteger(g) || g < 0) return bad(`${label} must be a whole number, 0 or more`);
  return ok();
}

export function validateTargets(t: Targets) {
  const fields = {
    calorie_target: validateCalories(t.calorie_target),
    protein_target_g: validateProtein(t.protein_target_g),
    carbs_target_g: validateOptionalMacro("Carbs", t.carbs_target_g),
    fat_target_g: validateOptionalMacro("Fat", t.fat_target_g),
  };
  return { valid: Object.values(fields).every((f) => f.ok), fields };
}

// ---------- labeled illustrative presets (never an auto-suggested deficit, PRD 4.4) ----------
export interface TargetPreset {
  id: string;
  label: string;
  goal: GoalType;
  description: string;
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number | null;
  fat_target_g: number | null;
}
export const PRESETS_DISCLAIMER =
  "Illustrative examples to get you started, not medical advice. Adjust them to fit you.";

export const PRESETS: readonly TargetPreset[] = [
  { id: "cut-moderate", label: "Gentle cut", goal: "cut", description: "A modest step down from maintenance.",
    calorie_target: 1800, protein_target_g: 130, carbs_target_g: 190, fat_target_g: 60 },
  { id: "maintain-balanced", label: "Steady maintain", goal: "maintain", description: "A balanced day to hold your weight.",
    calorie_target: 2200, protein_target_g: 120, carbs_target_g: 250, fat_target_g: 70 },
  { id: "bulk-lean", label: "Lean bulk", goal: "bulk", description: "A small surplus to build slowly.",
    calorie_target: 2700, protein_target_g: 150, carbs_target_g: 320, fat_target_g: 85 },
];
export const presetsForGoal = (goal: GoalType) => PRESETS.filter((p) => p.goal === goal);

// ---------- whole-flow check before saving ----------
export interface OnboardingValues extends BodyStats, Targets {
  goal_type: GoalType | null;
  target_weight_kg: number | null;
}
export function validateOnboarding(v: OnboardingValues) {
  const body = validateBodyStats(v);
  const goal = validateGoal(v.goal_type, v.weight_kg, v.target_weight_kg);
  const targets = validateTargets(v);
  return { valid: body.valid && goal.ok && targets.valid, body, goal, targets };
}
