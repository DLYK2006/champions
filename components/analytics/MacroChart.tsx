"use client";
// Profile macros chart (Databricks analytics). Owner: @DLYK2006; Jay styles it.
// Data: GET /api/analytics (Databricks SQL warehouse, Supabase fallback). Targets come from the profile.
// Palette validated with the dataviz validator on the app surface #fbf4e4 (all checks pass; gold needs
// visible labels, which every segment has).
import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { GoalType } from "@/types";

const MACROS = [
  { key: "protein_g", label: "Protein", color: "#3a8a3f" },
  { key: "carbs_g", label: "Carbs", color: "#c99a2e" },
  { key: "fat_g", label: "Fat", color: "#b0573a" },
] as const;
const INK = "#2f3b26", MUTED = "#6b6146", BAND = "#e3dcc6", BAR = "#46623b";
const MAX_BARS = 14;

type Day = { date: string; calories: number; protein_g: number; carbs_g: number; fat_g: number };
type Props = { date?: string | null; from?: string | null; to?: string | null; calorieTarget: number; goalType: GoalType };

const round = (n: number) => Math.round(n);
const short = (d: string) => new Date(`${d}T00:00:00`).toLocaleDateString(undefined, { month: "short", day: "numeric" });

export function MacroChart({ date, from, to, calorieTarget, goalType }: Props) {
  const [data, setData] = useState<{ source: string; days: Day[] } | null>(null);
  const [error, setError] = useState<string | null>(null);
  const query = date ? `?date=${date}` : from && to ? `?from=${from}&to=${to}` : "";

  useEffect(() => {
    let active = true;
    createClient().auth.getSession()
      .then(({ data: s }) => fetch(`/api/analytics${query}`, { headers: { authorization: `Bearer ${s.session?.access_token}` } }))
      .then(async (res) => {
        const body = await res.json();
        if (!res.ok) throw new Error(body.error ?? "Couldn't load your chart.");
        if (active) setData(body);
      })
      .catch((e) => active && setError(e instanceof Error ? e.message : "Couldn't load your chart."));
    return () => { active = false; };
  }, [query]);

  const title = date ? short(date) : from && to ? `${short(from)} – ${short(to)}` : "All dates";
  if (error) return <div className="macro-chart"><p role="alert">{error}</p></div>;
  if (!data) return <div className="macro-chart"><p role="status">Loading your macros… (the first load can take a few seconds)</p></div>;
  if (!data.days.length) return <div className="macro-chart"><h3>Your macros · {title}</h3><p>No meals logged in this period yet.</p></div>;

  const n = data.days.length;
  const avg = (k: keyof Day) => data.days.reduce((s, d) => s + Number(d[k]), 0) / n;
  const macros = MACROS.map((m) => ({ ...m, grams: avg(m.key) }));
  const totalG = macros.reduce((s, m) => s + m.grams, 0) || 1;
  const lo = 0.9 * calorieTarget, hi = goalType === "bulk" ? null : 1.1 * calorieTarget;
  const shown = data.days.slice(-MAX_BARS);

  return (
    <div className="macro-chart space-y-4" style={{ overflowY: "auto", maxHeight: "min(70vh, 34rem)", width: "100%" }}>
      <h3>Your macros · {title}</h3>

      <section aria-label="Macro split">
        <h4>{n > 1 ? `Macro split (average of ${n} days)` : "Macro split"}</h4>
        <svg viewBox="0 0 300 22" width="100%" role="img" aria-label={macros.map((m) => `${m.label} ${round(m.grams)} g`).join(", ")}>
          {macros.map((m, i) => {
            const w = (m.grams / totalG) * 300;
            const x = macros.slice(0, i).reduce((s, p) => s + (p.grams / totalG) * 300, 0);
            const gap = i < macros.length - 1 && w > 2 ? 2 : 0;
            return (
              <rect key={m.key} x={x} y={0} width={Math.max(0, w - gap)} height={22} rx={4} fill={m.color}>
                <title>{`${m.label}: ${round(m.grams)} g (${round((m.grams / totalG) * 100)}%)`}</title>
              </rect>
            );
          })}
        </svg>
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm" style={{ color: INK }}>
          {macros.map((m) => (
            <li key={m.key} className="flex items-center gap-1">
              <span aria-hidden style={{ background: m.color, width: 10, height: 10, borderRadius: 2, display: "inline-block" }} />
              {m.label} {round(m.grams)} g · {round((m.grams / totalG) * 100)}%
            </li>
          ))}
        </ul>
      </section>

      <section aria-label="Calories versus target">
        <h4>Calories vs target</h4>
        <CaloriesBars days={shown} lo={lo} hi={hi} target={calorieTarget} />
        <p className="text-sm" style={{ color: MUTED }}>
          Goal range: {round(lo)}{hi ? `–${round(hi)}` : "+"} kcal{n > MAX_BARS ? ` · showing the last ${MAX_BARS} days` : ""}
        </p>
      </section>

      <details className="text-sm">
        <summary>Show numbers</summary>
        <table className="w-full text-left">
          <thead><tr><th>Date</th><th>kcal</th><th>Protein</th><th>Carbs</th><th>Fat</th></tr></thead>
          <tbody>
            {data.days.map((d) => (
              <tr key={d.date}><td>{short(d.date)}</td><td>{round(d.calories)}</td><td>{round(d.protein_g)} g</td><td>{round(d.carbs_g)} g</td><td>{round(d.fat_g)} g</td></tr>
            ))}
          </tbody>
        </table>
      </details>

      <p className="text-xs" style={{ color: MUTED }}>
        {data.source === "databricks" ? "Analytics by Databricks" : "Databricks is warming up; showing your saved totals"}
      </p>
    </div>
  );
}

// One bar per day on a shared calorie axis, with the goal band behind (no second axis).
function CaloriesBars({ days, lo, hi, target }: { days: Day[]; lo: number; hi: number | null; target: number }) {
  const W = 300, H = 120, top = 8, bottom = 18;
  const max = Math.max(target * 1.3, ...days.map((d) => d.calories));
  const y = (v: number) => top + (1 - v / max) * (H - top - bottom);
  const slot = W / days.length, bw = Math.min(28, slot - 4);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} width="100%" role="img" aria-label={days.map((d) => `${short(d.date)} ${Math.round(d.calories)} kcal`).join(", ")}>
      <rect x={0} y={y(hi ?? max)} width={W} height={y(lo) - y(hi ?? max)} fill={BAND} opacity={0.6} />
      <line x1={0} x2={W} y1={y(target)} y2={y(target)} stroke={MUTED} strokeDasharray="3 3" strokeWidth={1} />
      <line x1={0} x2={W} y1={H - bottom} y2={H - bottom} stroke={MUTED} strokeWidth={1} opacity={0.5} />
      {days.map((d, i) => {
        const x = i * slot + (slot - bw) / 2;
        return (
          <g key={d.date}>
            <rect x={x} y={y(d.calories)} width={bw} height={H - bottom - y(d.calories)} rx={4} fill={BAR}>
              <title>{`${short(d.date)}: ${Math.round(d.calories)} kcal (target ${Math.round(target)})`}</title>
            </rect>
            {(days.length <= 7 || i % Math.ceil(days.length / 7) === 0) && (
              <text x={x + bw / 2} y={H - 4} textAnchor="middle" fontSize={9} fill={MUTED}>{short(d.date)}</text>
            )}
            {days.length <= 7 && (
              <text x={x + bw / 2} y={y(d.calories) - 3} textAnchor="middle" fontSize={9} fill={INK}>{Math.round(d.calories)}</text>
            )}
          </g>
        );
      })}
    </svg>
  );
}
