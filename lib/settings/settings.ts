// Settings logic with no React or Supabase, so it can be unit tested. Owner: @joshuatsou123.
// Uses the same rules as onboarding (lib/targets) so the Profile page can never save what onboarding refuses.
import { resolveTargetWeight, validateOnboarding, type FieldResult } from "../targets/targets";
import type { SettingsCheck, SettingsProfile } from "./types";

export const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
export const SETTINGS_COLUMNS =
  "username, goal_type, height_cm, weight_kg, age, target_weight_kg, calorie_target, protein_target_g, " +
  "carbs_target_g, fat_target_g, unit_preference, hide_status_from_group, notify_meal_reminders, notify_group_alerts";

const num = (v: unknown) => (typeof v === "string" ? Number(v) : (v as number));
const numOrNull = (v: unknown) => (v === null || v === undefined ? null : num(v));

/** A profiles row (numerics may arrive as strings) -> SettingsProfile. */
export function toSettings(row: Record<string, unknown>): SettingsProfile {
  return {
    username: String(row.username ?? ""),
    goal_type: row.goal_type as SettingsProfile["goal_type"],
    height_cm: num(row.height_cm),
    weight_kg: num(row.weight_kg),
    age: num(row.age),
    target_weight_kg: numOrNull(row.target_weight_kg),
    calorie_target: num(row.calorie_target),
    protein_target_g: num(row.protein_target_g),
    carbs_target_g: numOrNull(row.carbs_target_g),
    fat_target_g: numOrNull(row.fat_target_g),
    unit_preference: row.unit_preference === "imperial" ? "imperial" : "metric",
    hide_status_from_group: row.hide_status_from_group === true,
    notify_meal_reminders: row.notify_meal_reminders === true,
    notify_group_alerts: row.notify_group_alerts === true,
  };
}

/** Maintain locks target weight to current weight (PRD 4.2); username is trimmed. */
export function normalizeSettings(s: SettingsProfile): SettingsProfile {
  return {
    ...s,
    username: s.username.trim(),
    target_weight_kg: s.goal_type ? resolveTargetWeight(s.goal_type, s.weight_kg, s.target_weight_kg) : s.target_weight_kg,
  };
}

const bad = (error: string): FieldResult => ({ ok: false, error });

/** Field-by-field check, same rules as onboarding plus username, units and the toggles. */
export function validateSettings(input: SettingsProfile): SettingsCheck {
  const s = normalizeSettings(input);
  const o = validateOnboarding(s);
  const fields: SettingsCheck["fields"] = {
    username: USERNAME_RE.test(s.username) ? { ok: true } : bad("Usernames are 3 to 20 letters, numbers or _"),
    ...o.body.fields,
    goal_type: o.goal,
    ...o.targets.fields,
    unit_preference: s.unit_preference === "metric" || s.unit_preference === "imperial" ? { ok: true } : bad("Pick metric or imperial"),
  };
  for (const k of ["hide_status_from_group", "notify_meal_reminders", "notify_group_alerts"] as const) {
    fields[k] = typeof s[k] === "boolean" ? { ok: true } : bad("Must be on or off");
  }
  return { valid: Object.values(fields).every((f) => f?.ok), fields };
}

/** The first error message in a check, for a single-line notice. */
export const firstError = (c: SettingsCheck) => Object.values(c.fields).find((f) => f && !f.ok)?.error ?? null;

/** Thrown by saveSettings when the input breaks a rule; `fields` says which. */
export class SettingsValidationError extends Error {
  readonly fields: SettingsCheck["fields"];
  constructor(fields: SettingsCheck["fields"]) {
    super(firstError({ valid: false, fields }) ?? "Check your settings and try again.");
    this.name = "SettingsValidationError";
    this.fields = fields;
  }
}

// ---------- "profile changed" event: Home, Profile and Shop refetch without a reload ----------
export const PROFILE_UPDATED_EVENT = "digin:profile-updated";

export function notifyProfileUpdated(): void {
  if (typeof window !== "undefined") window.dispatchEvent(new Event(PROFILE_UPDATED_EVENT));
}

/** Calls `cb` whenever settings, outfit or purchases change. Returns the unsubscribe function. */
export function onProfileUpdated(cb: () => void): () => void {
  if (typeof window === "undefined") return () => {};
  window.addEventListener(PROFILE_UPDATED_EVENT, cb);
  return () => window.removeEventListener(PROFILE_UPDATED_EVENT, cb);
}
