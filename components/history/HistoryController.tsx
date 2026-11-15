"use client";
// /history: month calendar of past logs, streak, and a day's meals. Plain markup; Jay styles it after.
// Owner: @DLYK2006
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { DailyProgress } from "@/types";
import { localDate } from "@/lib/groups/api";
import { currentStreak, dayStatus, monthCells, ymd, type DayStatus } from "@/lib/history/calendar";
import { loadDay, loadMonth, loadProfile, type HistoryProfile, type MealRow } from "@/lib/history/api";

const WEEKDAYS = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
const STATUS_LABEL: Record<DayStatus, string> = { goal: "goal met", logged: "meals logged", none: "nothing logged" };
const STATUS_CLASS: Record<DayStatus, string> = {
  goal: "bg-emerald-500 text-white",
  logged: "bg-emerald-100 text-emerald-900",
  none: "bg-zinc-100 text-zinc-500",
};
const round = (n: number) => Math.round(Number(n));

const fail = (setError: (m: string) => void) => (e: unknown) =>
  setError(e instanceof Error ? e.message : "Couldn't load your history. Try again.");

export function HistoryController() {
  const router = useRouter();
  // Dates are read only after mount: Cache Components forbids new Date() while prerendering.
  const [today, setToday] = useState<string | null>(null);
  const [month, setMonth] = useState<{ year: number; month: number } | null>(null);
  const [profile, setProfile] = useState<HistoryProfile | null>(null);
  const [days, setDays] = useState<Record<string, DailyProgress>>({});
  const [selected, setSelected] = useState<string | null>(null);
  const [meals, setMeals] = useState<MealRow[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    loadProfile()
      .then((p) => {
        if (!active) return;
        if (!p) return router.replace("/onboarding");
        const now = new Date();
        setToday(localDate(now));
        setSelected(localDate(now));
        setMonth({ year: now.getFullYear(), month: now.getMonth() });
        setProfile(p);
      })
      .catch((e) => { if (active) fail(setError)(e); });
    return () => { active = false; };
  }, [router]);

  useEffect(() => {
    if (!month) return;
    let active = true;
    const last = new Date(month.year, month.month + 1, 0).getDate();
    loadMonth(ymd(month.year, month.month, 1), ymd(month.year, month.month, last))
      .then((rows) => { if (active) setDays(Object.fromEntries(rows.map((r) => [r.date, r]))); })
      .catch((e) => { if (active) fail(setError)(e); });
    return () => { active = false; };
  }, [month]);

  useEffect(() => {
    let active = true;
    if (selected) loadDay(selected).then(rows => { if (active) setMeals(rows); }).catch((e) => { if (active) fail(setError)(e); });
    return () => { active = false; };
  }, [selected]);

  const select = (date: string) => {
    setMeals(null);
    setSelected(date);
  };

  if (error) {
    return (
      <div className="history-panel">
        <p role="alert">{error}</p>
        <button type="button" onClick={() => location.reload()}>Try again</button>
      </div>
    );
  }
  if (!profile || !today || !month || !selected) return <div className="history-panel"><p role="status">Opening your history…</p></div>;

  const streak = currentStreak(profile.streak, profile.last_meal_date, today);
  const isThisMonth = today.startsWith(ymd(month.year, month.month, 1).slice(0, 7));
  const shift = (delta: number) =>
    setMonth({ year: new Date(month.year, month.month + delta).getFullYear(), month: new Date(month.year, month.month + delta).getMonth() });
  const title = new Date(month.year, month.month).toLocaleDateString(undefined, { month: "long", year: "numeric" });
  const day = days[selected];

  return (
    <div className="history-panel space-y-5">
      <header>
        <h3 className="text-xl font-semibold">Your history</h3>
        <p>
          {!streak
            ? "Log a meal today to start a streak."
            : profile.last_meal_date === today
              ? `${streak}-day streak. Today counts.`
              : `${streak}-day streak. Log a meal today to keep it going.`}
        </p>
      </header>

      <section aria-label="Calendar">
        <div className="mb-2 flex items-center justify-between">
          <button type="button" onClick={() => shift(-1)} aria-label="Previous month">‹</button>
          <h4 className="font-medium">{title}</h4>
          <button type="button" onClick={() => shift(1)} disabled={isThisMonth} aria-label="Next month">›</button>
        </div>
        <div className="grid grid-cols-7 gap-1 text-center text-xs">
          {WEEKDAYS.map((d) => <span key={d} aria-hidden>{d}</span>)}
          {monthCells(month.year, month.month).map((date, i) => {
            if (!date) return <span key={`blank-${i}`} />;
            const status = dayStatus(days[date]);
            const future = date > today;
            return (
              <button
                key={date}
                type="button"
                disabled={future}
                onClick={() => select(date)}
                aria-pressed={date === selected}
                aria-label={`${date}: ${future ? "upcoming" : STATUS_LABEL[status]}`}
                className={`aspect-square rounded ${future ? "opacity-30" : STATUS_CLASS[status]} ${date === selected ? "ring-2 ring-zinc-900" : ""}`}
              >
                {Number(date.slice(8))}
              </button>
            );
          })}
        </div>
        <p className="mt-2 text-xs">Dark green: goal met · Light green: meals logged</p>
      </section>

      <section aria-live="polite">
        <h4 className="font-medium">
          {new Date(`${selected}T00:00:00`).toLocaleDateString(undefined, { weekday: "long", month: "long", day: "numeric" })}
        </h4>
        {day && (
          <p>
            {round(day.total_calories)} / {profile.calorie_target} kcal · {round(day.total_protein_g)} / {profile.protein_target_g} g protein
            {day.personal_goal_completed && " · goal met"}
          </p>
        )}
        {meals === null ? (
          <p role="status">Loading meals…</p>
        ) : meals.length === 0 ? (
          <p>No meals logged this day.</p>
        ) : (
          <ul className="mt-2 space-y-2">
            {meals.map((m) => (
              <li key={m.id}>
                <strong className="capitalize">{m.meal_type}</strong>: {m.items.map((i) => i.name).join(", ")}
                <br />
                <small>{round(m.calories)} kcal · {round(m.protein_g)} g protein · {round(m.carbs_g)} g carbs · {round(m.fat_g)} g fat</small>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
