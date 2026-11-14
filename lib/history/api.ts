// Data for /history. Reads only the signed-in user's own rows (RLS). Owner: @DLYK2006
import { createClient } from "@/lib/supabase/client";
import type { DailyProgress, MealType, ScanItem } from "@/types";

export interface HistoryProfile { calorie_target: number; protein_target_g: number; streak: number; last_meal_date: string | null }
export interface MealRow {
  id: string; meal_type: MealType; items: ScanItem[]; created_at: string;
  calories: number; protein_g: number; carbs_g: number; fat_g: number;
}

// null means "no session or no profile": send the user to onboarding.
export async function loadProfile(): Promise<HistoryProfile | null> {
  const supabase = createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from("profiles").select("calorie_target, protein_target_g, streak, last_meal_date").maybeSingle();
  if (error) throw new Error(error.message);
  return data;
}

export async function loadMonth(from: string, to: string): Promise<DailyProgress[]> {
  const { data, error } = await createClient().from("daily_progress").select("*").gte("date", from).lte("date", to);
  if (error) throw new Error(error.message);
  return data;
}

export async function loadDay(date: string): Promise<MealRow[]> {
  const { data, error } = await createClient()
    .from("meals").select("id, meal_type, items, created_at, calories, protein_g, carbs_g, fat_g")
    .eq("date", date).order("created_at");
  if (error) throw new Error(error.message);
  return data;
}
