// Pure calendar helpers for /history (no imports at runtime, so node --test can run them). Owner: @DLYK2006
import type { DailyProgress } from "@/types";

export type DayStatus = "goal" | "logged" | "none";

// Missed days are just "none": shown neutrally, never as failures (PRD 9.5).
export const dayStatus = (p?: Pick<DailyProgress, "total_calories" | "personal_goal_completed">): DayStatus =>
  !p ? "none" : p.personal_goal_completed ? "goal" : Number(p.total_calories) > 0 ? "logged" : "none";

const pad = (n: number) => String(n).padStart(2, "0");
export const ymd = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`; // month is 0-based

// Cells for a month grid starting on Monday: leading nulls, then one YYYY-MM-DD per day.
export function monthCells(year: number, month: number): (string | null)[] {
  const lead = (new Date(year, month, 1).getDay() + 6) % 7;
  const days = new Date(year, month + 1, 0).getDate();
  return [...Array<null>(lead).fill(null), ...Array.from({ length: days }, (_, i) => ymd(year, month, i + 1))];
}

// profiles.streak only changes when a qualifying meal is logged, so after a missed day it is stale.
// It is still alive if the last qualifying meal was today or yesterday (local dates).
export function currentStreak(streak: number, lastMealDate: string | null, today: string): number {
  if (!lastMealDate) return 0;
  const y = new Date(`${today}T00:00:00`);
  y.setDate(y.getDate() - 1);
  return lastMealDate >= ymd(y.getFullYear(), y.getMonth(), y.getDate()) ? streak : 0;
}
