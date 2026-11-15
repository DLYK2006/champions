// What the Profile settings page reads and writes (PRD 14.1). Storage is metric; the UI converts for display
// with lib/targets (cmFromFeetInches, kgFromLb, ...). Owner: @joshuatsou123.
import type { Avatar, GoalType } from "../../types/index";
import type { FieldResult, Units } from "../targets";
import type { ActivityLevel } from "../targets/recommend";

export interface SettingsProfile {
  username: string;
  goal_type: GoalType;
  height_cm: number;
  weight_kg: number;
  age: number;
  target_weight_kg: number | null;
  calorie_target: number;
  protein_target_g: number;
  carbs_target_g: number | null;
  fat_target_g: number | null;
  unit_preference: Units;
  hide_status_from_group: boolean;
  notify_meal_reminders: boolean;
  notify_group_alerts: boolean;
  /** Exercise frequency for the personal recommendation (null for profiles made before it existed). */
  activity_level: ActivityLevel | null;
  /** Base look plus the free starter wardrobe (hat/pants/shoes). Paid items are equipped via the Shop RPCs, not here. */
  avatar: Avatar;
}

export type SettingsField = keyof SettingsProfile;
export interface SettingsCheck { valid: boolean; fields: Partial<Record<SettingsField, FieldResult>> }
