// Personal starting targets from body stats + exercise frequency (Daren, Nov 15; PRD 4.4 "Mifflin-St Jeor").
// Pure, deterministic and testable: the AI only explains these numbers, it never picks them.
// Owner: @DLYK2006 (in Josh's lib/targets, lead-assigned).
import type { GoalType } from "../../types/index";

export const ACTIVITY_LEVELS = [
  { id: "sedentary", label: "Rarely or never", factor: 1.2 },
  { id: "light", label: "1–2 times a week", factor: 1.375 },
  { id: "moderate", label: "3–5 times a week", factor: 1.55 },
  { id: "very", label: "6–7 times a week", factor: 1.725 },
] as const;
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number]["id"];

const GOAL_FACTOR: Record<GoalType, number> = { maintain: 1, bulk: 1.1, cut: 0.85 }; // +10% / -15%
const PROTEIN_PER_KG: Record<GoalType, number> = { maintain: 1.2, bulk: 1.6, cut: 1.6 };
const MIN_KCAL = 1500; // never recommend below this (BUILD_PLAN: warn < 1500, block < 1200)

export interface Recommendation {
  bmr: number; tdee: number;
  calorie_target: number; protein_target_g: number; carbs_target_g: number; fat_target_g: number;
}

export function recommendTargets(input: {
  weight_kg: number; height_cm: number; age: number; goal: GoalType; activity: ActivityLevel;
}): Recommendation {
  const { weight_kg, height_cm, age, goal, activity } = input;
  // Mifflin-St Jeor; -78 is the midpoint of the male (+5) and female (-161) constants (no sex question).
  const bmr = 10 * weight_kg + 6.25 * height_cm - 5 * age - 78;
  const factor = ACTIVITY_LEVELS.find((a) => a.id === activity)!.factor;
  const tdee = bmr * factor;
  const kcal = Math.min(5000, Math.max(MIN_KCAL, bmr, tdee * GOAL_FACTOR[goal]));
  const calorie_target = Math.round(kcal / 10) * 10;
  const protein_target_g = Math.min(300, Math.max(30, Math.round(weight_kg * PROTEIN_PER_KG[goal])));
  const fat_target_g = Math.round((calorie_target * 0.25) / 9); // 25% of energy from fat
  const carbs_target_g = Math.max(0, Math.round((calorie_target - protein_target_g * 4 - fat_target_g * 9) / 4));
  return { bmr: Math.round(bmr), tdee: Math.round(tdee), calorie_target, protein_target_g, carbs_target_g, fat_target_g };
}
