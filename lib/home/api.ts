// Real Home data: the signed-in user's profile, today's daily_progress and their group's progress.
// A missing session or profile means "go to onboarding". Owner: @joshuatsou123.
import { createClient } from "../supabase/client";
import { getGroupStatus, localDate } from "../groups/api";
import type { DailyProgress, GroupDailyProgress, Profile } from "../../types/index";
import { toProfile, toProgress } from "./home";

export type HomeData =
  | { kind: "onboarding" }
  | { kind: "ready"; profile: Profile; progress: DailyProgress; group: GroupDailyProgress | null };

const PROFILE_COLUMNS =
  "id, username, goal_type, height_cm, weight_kg, age, target_weight_kg, calorie_target, protein_target_g, " +
  "carbs_target_g, fat_target_g, avatar, equipped, coin_balance, streak";

/** Loads everything Home shows for the user's local date. Throws an Error with a user-safe message. */
export async function loadHome(date: string = localDate()): Promise<HomeData> {
  const supabase = createClient();
  const { data: sessionData } = await supabase.auth.getSession();
  if (!sessionData.session) return { kind: "onboarding" };

  const [profile, progress, group] = await Promise.all([
    supabase.from("profiles").select(PROFILE_COLUMNS).maybeSingle(),
    supabase.from("daily_progress").select("*").eq("date", date).maybeSingle(),
    // The garden preview is optional: if the group call fails, Home still loads without it.
    getGroupStatus(date).catch(() => null),
  ]);
  if (profile.error || progress.error) throw new Error("Couldn't load your day. Try again.");
  if (!profile.data) return { kind: "onboarding" };

  return {
    kind: "ready",
    profile: toProfile(profile.data as unknown as Record<string, unknown>),
    progress: toProgress(progress.data as Record<string, unknown> | null, date),
    group: group?.progress ?? null,
  };
}
