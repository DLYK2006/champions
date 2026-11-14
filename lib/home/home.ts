// Home controller logic: maps database rows onto the shared Profile / DailyProgress types that Jay's
// HomeScreen takes. Pure (no React, no Supabase) so it can be unit tested. Owner: @joshuatsou123.
import type { AvatarConfig, DailyProgress, GoalType, Profile } from "../../types/index";

/** Used when a profile's avatar column is empty or partial (the column defaults to '{}'). */
export const FALLBACK_AVATAR: AvatarConfig = {
  skinColor: "edb98a",
  top: "shortFlat",
  hairColor: "2c1b18",
  eyes: "default",
  mouth: "smile",
  clothing: "hoodie",
};

const n = (v: unknown, fallback = 0) => {
  const x = typeof v === "string" ? Number(v) : v;
  return typeof x === "number" && Number.isFinite(x) ? x : fallback;
};
const nOrNull = (v: unknown) => (v === null || v === undefined ? null : n(v, 0));

/** The signed-in user's profile row (columns Home needs). */
export type ProfileRow = Record<string, unknown>;

export function toProfile(row: ProfileRow): Profile {
  const avatar = (row.avatar && typeof row.avatar === "object" ? row.avatar : {}) as Partial<AvatarConfig>;
  const merged = { ...FALLBACK_AVATAR };
  for (const key of Object.keys(FALLBACK_AVATAR) as (keyof AvatarConfig)[]) {
    if (typeof avatar[key] === "string" && avatar[key]) merged[key] = avatar[key] as string;
  }
  return {
    id: String(row.id),
    username: String(row.username ?? ""),
    goal_type: row.goal_type as GoalType,
    height_cm: n(row.height_cm),
    weight_kg: n(row.weight_kg),
    age: n(row.age),
    target_weight_kg: nOrNull(row.target_weight_kg),
    calorie_target: n(row.calorie_target),
    protein_target_g: n(row.protein_target_g),
    carbs_target_g: nOrNull(row.carbs_target_g),
    fat_target_g: nOrNull(row.fat_target_g),
    avatar: merged,
    equipped: Array.isArray(row.equipped) ? row.equipped.filter((x): x is string => typeof x === "string") : [],
    coin_balance: n(row.coin_balance),
    streak: n(row.streak),
  };
}

/** What Home shows before anything is logged today (no daily_progress row exists yet). */
export const emptyProgress = (date: string): DailyProgress => ({
  date,
  meals_logged: 0,
  total_calories: 0,
  total_protein_g: 0,
  total_carbs_g: 0,
  total_fat_g: 0,
  calorie_goal_completed: false,
  protein_goal_completed: false,
  personal_goal_completed: false,
});

/** A daily_progress row (or none) -> DailyProgress. Numerics may arrive as strings; normalise them. */
export function toProgress(row: Record<string, unknown> | null | undefined, date: string): DailyProgress {
  if (!row) return emptyProgress(date);
  return {
    date: String(row.date ?? date),
    meals_logged: n(row.meals_logged),
    total_calories: n(row.total_calories),
    total_protein_g: n(row.total_protein_g),
    total_carbs_g: n(row.total_carbs_g),
    total_fat_g: n(row.total_fat_g),
    calorie_goal_completed: row.calorie_goal_completed === true,
    protein_goal_completed: row.protein_goal_completed === true,
    personal_goal_completed: row.personal_goal_completed === true,
  };
}
