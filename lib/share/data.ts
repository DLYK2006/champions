// What goes on the share card (PRD 11.4). Owner: @DLYK2006
// Only the user's own rows plus their group's completion. No calorie, macro or weight numbers.
import { createClient } from "@/lib/supabase/client";
import { getGroupStatus, localDate } from "@/lib/groups/api";
import { currentStreak } from "@/lib/history/calendar";
import type { Avatar } from "@/types";

export interface ShareData {
  username: string;
  avatar: Avatar;
  equipped: string[];
  streak: number;
  mealsToday: number;
  goalMet: boolean;
  group: { name: string; completion: number } | null;
}

export async function loadShareData(): Promise<ShareData> {
  const supabase = createClient();
  const today = localDate();
  const [{ data: profile, error }, { data: day, error: dayError }, group] = await Promise.all([
    supabase.from("profiles").select("username, avatar, equipped, streak, last_meal_date").maybeSingle(),
    supabase.from("daily_progress").select("meals_logged, personal_goal_completed").eq("date", today).maybeSingle(),
    getGroupStatus(today),
  ]);
  if (error || dayError) throw new Error((error ?? dayError)!.message);
  if (!profile) throw new Error("Set up your profile first.");
  return {
    username: profile.username,
    avatar: profile.avatar,
    equipped: profile.equipped ?? [],
    streak: currentStreak(profile.streak, profile.last_meal_date, today),
    mealsToday: day?.meals_logged ?? 0,
    goalMet: day?.personal_goal_completed ?? false,
    group: group ? { name: group.group.name, completion: Number(group.progress.completion_percentage) } : null,
  };
}
