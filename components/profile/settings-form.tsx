"use client";

import { useEffect, useState } from "react";
import type { SettingsProfile } from "@/lib/settings";
import { validateSettings } from "@/lib/settings";
import {
  cmFromFeetInches,
  feetInchesFromCm,
  kgFromLb,
  lbFromKg,
  round1,
  PRESETS_DISCLAIMER,
} from "@/lib/targets";
import { ACTIVITY_LEVELS, recommendTargets, type ActivityLevel } from "@/lib/targets/recommend";
import { AppearancePicker } from "@/components/avatar/appearance-picker";

const measurements = (s: SettingsProfile) => {
  const { ft, inch } = feetInchesFromCm(s.height_cm);
  return {
    height: String(s.height_cm),
    ft: String(ft),
    inch: String(inch),
    weight: String(
      s.unit_preference === "metric"
        ? s.weight_kg
        : round1(lbFromKg(s.weight_kg)),
    ),
    target:
      s.target_weight_kg == null
        ? ""
        : String(
            s.unit_preference === "metric"
              ? s.target_weight_kg
              : round1(lbFromKg(s.target_weight_kg)),
          ),
  };
};
const number = (s: string) => (s.trim() === "" ? NaN : Number(s));
type Props = {
  value: SettingsProfile;
  onChange: (s: SettingsProfile) => void;
  onSave: () => void;
  onReset: () => void;
  pending: boolean;
  dirty: boolean;
};
export function SettingsForm({
  value,
  onChange,
  onSave,
  onReset,
  pending,
  dirty,
}: Props) {
  const [raw, setRaw] = useState(() => ({
    ...measurements(value),
    age: String(value.age),
    calorie_target: String(value.calorie_target),
    protein_target_g: String(value.protein_target_g),
    carbs_target_g:
      value.carbs_target_g == null ? "" : String(value.carbs_target_g),
    fat_target_g: value.fat_target_g == null ? "" : String(value.fat_target_g),
  }));
  const check = validateSettings(value);
  // Personal recommendation (same formula as onboarding); the AI only explains it.
  const statsOk = [value.weight_kg, value.height_cm, value.age].every((n) => Number.isFinite(n) && n > 0);
  const rec = value.activity_level && statsOk
    ? recommendTargets({ weight_kg: value.weight_kg, height_cm: value.height_cm, age: value.age, goal: value.goal_type, activity: value.activity_level })
    : null;
  const recKey = rec ? `${value.goal_type}|${value.activity_level}|${value.weight_kg}|${value.height_cm}|${value.age}` : "";
  const [explained, setExplained] = useState<{ key: string; text: string } | null>(null);
  useEffect(() => {
    if (!rec || explained?.key === recKey) return;
    let active = true;
    const t = setTimeout(() => {
      fetch("/api/targets/explain", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ weight_kg: value.weight_kg, height_cm: value.height_cm, age: value.age, goal: value.goal_type, activity: value.activity_level }),
      })
        .then((r) => (r.ok ? r.json() : null))
        .then((b) => { if (active && b?.explanation) setExplained({ key: recKey, text: b.explanation }); })
        .catch(() => undefined); // optional; the numbers never depend on it
    }, 600); // wait for typing to settle
    return () => { active = false; clearTimeout(t); };
  }, [recKey]); // eslint-disable-line react-hooks/exhaustive-deps -- recKey captures every input
  const imperial = value.unit_preference === "imperial";
  function measure(
    key: "height" | "ft" | "inch" | "weight" | "target",
    text: string,
  ) {
    const next = { ...raw, [key]: text };
    setRaw(
      key === "weight" && value.goal_type === "maintain"
        ? { ...next, target: text }
        : next,
    );
    const field =
      key === "weight"
        ? "weight_kg"
        : key === "target"
          ? "target_weight_kg"
          : "height_cm";
    const n =
      key === "weight" || key === "target"
        ? imperial
          ? kgFromLb(number(text))
          : number(text)
        : imperial
          ? cmFromFeetInches(number(next.ft), number(next.inch))
          : number(text);
    onChange({
      ...value,
      [field]: n,
      ...(field === "weight_kg" && value.goal_type === "maintain"
        ? { target_weight_kg: n }
        : {}),
    });
  }
  function units(unit: SettingsProfile["unit_preference"]) {
    if (![value.height_cm, value.weight_kg].every(Number.isFinite)) return;
    const next = { ...value, unit_preference: unit };
    setRaw({ ...raw, ...measurements(next) });
    onChange(next);
  }
  const error = (key: keyof SettingsProfile) => {
    const result = check.fields[key];
    return result && (!result.ok || result.warning) ? (
      <small className={!result.ok ? "field-error" : "field-warning"}>
        {result.error ?? result.warning}
      </small>
    ) : null;
  };
  const input = (
    label: string,
    key: keyof typeof raw,
    change: (s: string) => void,
    problem?: keyof SettingsProfile,
    disabled = false,
  ) => (
    <label className="profile-field">
      {label}
      <input
        aria-label={label}
        type="number"
        step="any"
        inputMode="decimal"
        value={raw[key]}
        disabled={pending || disabled}
        onChange={(e) => change(e.target.value)}
        aria-invalid={problem ? !check.fields[problem]?.ok : undefined}
      />
      {problem && error(problem)}
    </label>
  );
  return (
    <form
      className="profile-form"
      onSubmit={(e) => {
        e.preventDefault();
        if (check.valid && dirty && !pending) onSave();
      }}
    >
      <label className="profile-field">
        Username
        <input
          aria-label="Username"
          value={value.username}
          disabled={pending}
          maxLength={20}
          autoComplete="username"
          onChange={(e) => onChange({ ...value, username: e.target.value })}
          aria-invalid={!check.fields.username?.ok}
        />
        {error("username")}
      </label>
      <fieldset className="profile-choice" disabled={pending}>
        <legend>Units</legend>
        {(["metric", "imperial"] as const).map((u) => (
          <button
            type="button"
            key={u}
            aria-pressed={value.unit_preference === u}
            onClick={() => units(u)}
          >
            {u === "metric" ? "Metric" : "Imperial"}
          </button>
        ))}
      </fieldset>
      <div className="profile-fields">
        {imperial ? (
          <>
            <div>
              {input("Height (ft)", "ft", (s) => measure("ft", s), "height_cm")}
            </div>
            {input("Height (in)", "inch", (s) => measure("inch", s))}
          </>
        ) : (
          input(
            "Height (cm)",
            "height",
            (s) => measure("height", s),
            "height_cm",
          )
        )}
        {input(
          `Weight (${imperial ? "lb" : "kg"})`,
          "weight",
          (s) => measure("weight", s),
          "weight_kg",
        )}
        {input(
          "Age",
          "age",
          (s) => {
            setRaw({ ...raw, age: s });
            onChange({ ...value, age: number(s) });
          },
          "age",
        )}
      </div>
      <label className="profile-field">
        How often do you exercise?
        <select
          value={value.activity_level ?? ""}
          disabled={pending}
          onChange={(e) => onChange({ ...value, activity_level: (e.target.value || null) as ActivityLevel | null })}
        >
          <option value="">Choose one</option>
          {ACTIVITY_LEVELS.map((a) => <option key={a.id} value={a.id}>{a.label}</option>)}
        </select>
      </label>
      <fieldset className="profile-choice" disabled={pending}>
        <legend>Goal</legend>
        {(["bulk", "cut", "maintain"] as const).map((g) => (
          <button
            type="button"
            key={g}
            aria-pressed={value.goal_type === g}
            onClick={() => {
              if (g === "maintain") setRaw({ ...raw, target: raw.weight });
              onChange({
                ...value,
                goal_type: g,
                ...(g === "maintain"
                  ? { target_weight_kg: value.weight_kg }
                  : {}),
              });
            }}
          >
            {g[0].toUpperCase() + g.slice(1)}
          </button>
        ))}
      </fieldset>
      {value.goal_type !== "maintain" ? (
        input(
          `Target weight (${imperial ? "lb" : "kg"})`,
          "target",
          (s) => measure("target", s),
          "goal_type",
        )
      ) : (
        <p className="profile-hint">
          Target weight follows your current weight.
        </p>
      )}
      <h3>Daily nutrition</h3>
      <div className="profile-fields">
        {(
          [
            ["Calories (kcal)", "calorie_target"],
            ["Protein (g)", "protein_target_g"],
            ["Carbs (g, optional)", "carbs_target_g"],
            ["Fat (g, optional)", "fat_target_g"],
          ] as const
        ).map(([label, key]) => (
          <div key={key}>
            {input(
              label,
              key,
              (s) => {
                setRaw({ ...raw, [key]: s });
                onChange({
                  ...value,
                  [key]:
                    s === "" &&
                    (key === "carbs_target_g" || key === "fat_target_g")
                      ? null
                      : number(s),
                });
              },
              key,
            )}
          </div>
        ))}
      </div>
      {rec ? (
        <button
          className="button button-soft"
          type="button"
          disabled={pending}
          onClick={() => {
            const fields = {
              calorie_target: rec.calorie_target,
              protein_target_g: rec.protein_target_g,
              carbs_target_g: rec.carbs_target_g,
              fat_target_g: rec.fat_target_g,
            };
            onChange({ ...value, ...fields });
            setRaw({ ...raw, ...Object.fromEntries(Object.entries(fields).map(([k, v]) => [k, String(v)])) });
          }}
        >
          Apply recommended for you · {rec.calorie_target} kcal · {rec.protein_target_g} g protein
        </button>
      ) : (
        <p className="profile-hint">Choose how often you exercise to see a recommendation.</p>
      )}
      {rec && explained?.key === recKey && <p className="profile-hint">{explained.text}</p>}
      <p className="profile-hint">{PRESETS_DISCLAIMER}</p>
      <h3>Appearance</h3>
      <AppearancePicker
        value={value.avatar}
        disabled={pending}
        onChange={(avatar) => onChange({ ...value, avatar })}
      />
      <fieldset className="profile-preferences" disabled={pending}>
        <legend>Preferences</legend>
        {(
          [
            ["hide_status_from_group", "Hide my status from groups"],
            ["notify_meal_reminders", "Meal reminders"],
            ["notify_group_alerts", "Group alerts"],
          ] as const
        ).map(([key, label]) => (
          <label key={key}>
            <input
              type="checkbox"
              checked={value[key]}
              onChange={(e) => onChange({ ...value, [key]: e.target.checked })}
            />
            {label}
          </label>
        ))}
      </fieldset>
      <div className="profile-actions">
        <button
          className="button button-soft"
          type="button"
          disabled={pending || !dirty}
          onClick={onReset}
        >
          Reset Changes
        </button>
        <button
          className="button button-primary"
          disabled={pending || !dirty || !check.valid}
        >
          {pending ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </form>
  );
}
