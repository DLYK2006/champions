"use client";
// Onboarding: body stats -> goal -> nutrition targets -> avatar -> optional group step.
// Logic only, plain markup. Jay restyles this folder after (see board). Rules: lib/targets.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import type { AvatarConfig, GoalType } from "../../types/index";
import {
  ADULTS_ONLY_MESSAGE, PRESETS_DISCLAIMER, RANGES, cmFromFeetInches, kgFromLb, lbFromKg, feetInchesFromCm,
  presetsForGoal, resolveTargetWeight, round1, validateAge, validateBodyStats, validateCalories, validateGoal,
  validateOnboarding, validateOptionalMacro, validateProtein, type FieldResult, type Units,
} from "../../lib/targets";
import { AVATAR_LABELS, AVATAR_OPTIONS, DEFAULT_AVATAR } from "./avatarOptions";
import { PixelAvatar } from "../avatar";
import { Icon } from "../ui/icons";
import { avatarOptionLabel } from "../avatar/option-labels";

const STEPS = ["Body stats", "Goal", "Nutrition targets", "Avatar", "Group"] as const;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;

const num = (s: string) => (s.trim() === "" ? null : Number(s));
const Msg = ({ r }: { r?: FieldResult }) =>
  r?.error ? <p role="alert" data-error>{r.error}</p> : r?.warning ? <p data-warning>{r.warning}</p> : null;

export default function OnboardingFlow() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const headingRef = useRef<HTMLHeadingElement>(null);
  useEffect(() => { headingRef.current?.focus(); }, [step]);
  const [saving, setSaving] = useState(false);
  const [saveError, setSaveError] = useState<string | null>(null);

  // screen 1 (inputs held as strings so partial typing is fine)
  const [units, setUnits] = useState<Units>("metric");
  const [username, setUsername] = useState("");
  const [heightCm, setHeightCm] = useState("");
  const [heightFt, setHeightFt] = useState("");
  const [heightIn, setHeightIn] = useState("");
  const [weight, setWeight] = useState(""); // kg or lb, per `units`
  const [age, setAge] = useState("");
  // screen 2
  const [goal, setGoal] = useState<GoalType | null>(null);
  const [targetWeight, setTargetWeight] = useState("");
  // screen 3
  const [calories, setCalories] = useState("");
  const [protein, setProtein] = useState("");
  const [carbs, setCarbs] = useState("");
  const [fat, setFat] = useState("");
  const [presetId, setPresetId] = useState<string | null>(null);
  // screen 4
  const [avatar, setAvatar] = useState<AvatarConfig>(DEFAULT_AVATAR);

  // ---- metric values derived from the inputs (storage is always metric) ----
  const metric = useMemo(() => {
    const h = units === "metric" ? num(heightCm) : heightFt.trim() === "" ? null : round1(cmFromFeetInches(Number(heightFt), Number(heightIn || 0)));
    const w = num(weight);
    const tw = num(targetWeight);
    return {
      height_cm: h,
      weight_kg: w === null ? null : units === "metric" ? w : round1(kgFromLb(w)),
      target_weight_kg: tw === null ? null : units === "metric" ? tw : round1(kgFromLb(tw)),
      age: num(age),
    };
  }, [units, heightCm, heightFt, heightIn, weight, targetWeight, age]);

  const body = validateBodyStats(metric);
  const usernameOk = USERNAME_RE.test(username);
  const goalCheck = validateGoal(goal, metric.weight_kg, metric.target_weight_kg);
  const cal = validateCalories(num(calories));
  const pro = validateProtein(num(protein));
  const carbCheck = validateOptionalMacro("Carbs", num(carbs));
  const fatCheck = validateOptionalMacro("Fat", num(fat));
  const targetsOk = cal.ok && pro.ok && carbCheck.ok && fatCheck.ok;

  const canNext = [body.valid && usernameOk, goalCheck.ok, targetsOk, true, true][step];

  // Switching units converts what's typed so the numbers stay the same physical value.
  function switchUnits(next: Units) {
    if (next === units) return;
    if (metric.height_cm !== null) {
      if (next === "imperial") { const f = feetInchesFromCm(metric.height_cm); setHeightFt(String(f.ft)); setHeightIn(String(f.inch)); }
      else setHeightCm(String(Math.round(metric.height_cm)));
    }
    if (metric.weight_kg !== null) setWeight(String(next === "imperial" ? round1(lbFromKg(metric.weight_kg)) : metric.weight_kg));
    if (metric.target_weight_kg !== null) setTargetWeight(String(next === "imperial" ? round1(lbFromKg(metric.target_weight_kg)) : metric.target_weight_kg));
    setUnits(next);
  }

  function pickGoal(g: GoalType) {
    setGoal(g);
    if (g === "maintain") setTargetWeight(""); // clears any entered target (PRD 4.2)
    setPresetId(null);
  }

  function applyPreset(id: string) {
    const p = presetsForGoal(goal ?? "maintain").find((x) => x.id === id);
    if (!p) return;
    setPresetId(id);
    setCalories(String(p.calorie_target));
    setProtein(String(p.protein_target_g));
    setCarbs(p.carbs_target_g === null ? "" : String(p.carbs_target_g));
    setFat(p.fat_target_g === null ? "" : String(p.fat_target_g));
  }

  async function saveProfile(): Promise<boolean> {
    setSaveError(null);
    if (!goal || metric.height_cm === null || metric.weight_kg === null || metric.age === null) return false;
    const values = {
      height_cm: metric.height_cm, weight_kg: metric.weight_kg, age: metric.age, goal_type: goal,
      target_weight_kg: resolveTargetWeight(goal, metric.weight_kg, metric.target_weight_kg),
      calorie_target: num(calories), protein_target_g: num(protein), carbs_target_g: num(carbs), fat_target_g: num(fat),
    };
    if (!validateOnboarding(values).valid) { setSaveError("Some answers need another look. Go back and check each screen."); return false; }

    const supabase = createClient();
    let { data: { user } } = await supabase.auth.getUser();
    if (!user) {
      const { data, error } = await supabase.auth.signInAnonymously(); // demo accounts (BUILD_PLAN)
      if (error || !data.user) { setSaveError("Couldn't start your session. Try again."); return false; }
      user = data.user;
    }
    const { error } = await supabase.from("profiles").insert({ id: user.id, username, avatar, ...values });
    if (error) {
      setSaveError(error.code === "23505" ? "That username is taken. Go back and pick another." : "Couldn't save your profile. Try again.");
      return false;
    }
    return true;
  }

  async function finish(choice: "join" | "create" | "solo") {
    setSaving(true);
    const saved = await saveProfile();
    setSaving(false);
    if (!saved) return;
    // Join / create are stubbed until the Groups logic owner lands lib/groups; users can do it from Groups later.
    if (choice !== "solo") sessionStorage.setItem("digin:after-onboarding", choice);
    router.push("/");
  }

  return (
    <main className="mx-auto max-w-md p-6" data-onboarding>
      <p>{step < 4 ? `Step ${step + 1} of 4: ${STEPS[step]}` : 'Optional · A little company'}</p>
      <div className="onboarding-step-track" aria-hidden="true">{[0, 1, 2, 3].map(index => <span key={index} className={index <= step ? 'step-complete' : ''} />)}</div>

      {step === 0 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>First, a little about you.</h1>
          <fieldset>
            <legend>Units</legend>
            <label><input type="radio" name="units" checked={units === "metric"} onChange={() => switchUnits("metric")} /> Metric (cm, kg)</label>
            <label><input type="radio" name="units" checked={units === "imperial"} onChange={() => switchUnits("imperial")} /> Imperial (ft, lb)</label>
          </fieldset>
          <label>Username
            <input value={username} onChange={(e) => setUsername(e.target.value)} maxLength={20} autoComplete="username" />
          </label>
          {username !== "" && !usernameOk && <p role="alert" data-error>3 to 20 letters, numbers or underscores</p>}
          {units === "metric" ? (
            <label>Height (cm)
              <input inputMode="decimal" value={heightCm} onChange={(e) => setHeightCm(e.target.value)} />
            </label>
          ) : (
            <div>
              <label>Height (ft) <input inputMode="numeric" value={heightFt} onChange={(e) => setHeightFt(e.target.value)} /></label>
              <label>(in) <input inputMode="numeric" value={heightIn} onChange={(e) => setHeightIn(e.target.value)} /></label>
            </div>
          )}
          {metric.height_cm !== null && <Msg r={body.fields.height_cm} />}
          <label>Weight ({units === "metric" ? "kg" : "lb"})
            <input inputMode="decimal" value={weight} onChange={(e) => setWeight(e.target.value)} />
          </label>
          {metric.weight_kg !== null && <Msg r={body.fields.weight_kg} />}
          <label>Age
            <input inputMode="numeric" value={age} onChange={(e) => setAge(e.target.value)} />
          </label>
          {metric.age !== null && <Msg r={validateAge(metric.age)} />}
          <p>Adults only: {RANGES.age.min}+. {ADULTS_ONLY_MESSAGE}.</p>
        </section>
      )}

      {step === 1 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>Choose your own path.</h1>
          <p>Different journeys. The same little care for yourself.</p>
          <div className="onboarding-goal-cards" role="group" aria-label="Personal goal">
            {([{ id: 'bulk', title: 'Bulk', copy: 'Build and grow', icon: 'leaf' }, { id: 'cut', title: 'Cut', copy: 'A mindful change', icon: 'spark' }, { id: 'maintain', title: 'Maintain', copy: 'Find your rhythm', icon: 'sun' }] as const).map(choice => <button key={choice.id} type="button" aria-pressed={goal === choice.id} onClick={() => pickGoal(choice.id)}><Icon name={choice.icon} size={27} /><strong>{choice.title}</strong><span>{choice.copy}</span></button>)}
          </div>
          <label>Target weight ({units === "metric" ? "kg" : "lb"})
            <input
              inputMode="decimal"
              disabled={goal === "maintain"}
              value={goal === "maintain" ? (weight || "") : targetWeight}
              onChange={(e) => setTargetWeight(e.target.value)}
            />
          </label>
          {goal === "maintain" && <p>Target weight is set to your current weight.</p>}
          {goal && goal !== "maintain" && targetWeight !== "" && <Msg r={goalCheck} />}
        </section>
      )}

      {step === 2 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>Fuel your adventure.</h1>
          <p>{PRESETS_DISCLAIMER}</p>
          <div role="group" aria-label="Preset targets">
            {presetsForGoal(goal ?? "maintain").map((p) => (
              <button key={p.id} type="button" aria-pressed={presetId === p.id} onClick={() => applyPreset(p.id)}>
                {p.label} · {p.calorie_target} kcal · {p.protein_target_g} g protein <small>(illustrative)</small>
              </button>
            ))}
          </div>
          <p>Or enter your own:</p>
          <label>Calories (kcal)
            <input inputMode="numeric" value={calories} onChange={(e) => { setCalories(e.target.value); setPresetId(null); }} />
          </label>
          {calories !== "" && <Msg r={cal} />}
          <label>Protein (g)
            <input inputMode="numeric" value={protein} onChange={(e) => { setProtein(e.target.value); setPresetId(null); }} />
          </label>
          {protein !== "" && <Msg r={pro} />}
          <label>Carbs (g, optional)
            <input inputMode="numeric" value={carbs} onChange={(e) => setCarbs(e.target.value)} />
          </label>
          <Msg r={carbCheck} />
          <label>Fat (g, optional)
            <input inputMode="numeric" value={fat} onChange={(e) => setFat(e.target.value)} />
          </label>
          <Msg r={fatCheck} />
        </section>
      )}

      {step === 3 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>A little character. All you.</h1>
          <div className="onboarding-avatar-preview"><PixelAvatar config={avatar} size={155} name="Your customized pixel avatar" /></div>
          {(Object.keys(AVATAR_OPTIONS) as (keyof AvatarConfig)[]).map((key) => (
            key === 'skinColor' || key === 'hairColor' ? <fieldset className="avatar-color-field" key={key}><legend>{AVATAR_LABELS[key]}</legend>{AVATAR_OPTIONS[key].map(option => <button type="button" className="avatar-color-swatch" key={option} aria-label={`${AVATAR_LABELS[key]}: ${avatarOptionLabel(key, option)}`} aria-pressed={avatar[key] === option} style={{ backgroundColor: `#${option}` }} onClick={() => setAvatar({ ...avatar, [key]: option })}>{avatar[key] === option && <Icon name="check" size={20} />}</button>)}</fieldset> : <label key={key}>{AVATAR_LABELS[key]}
              <select aria-label={AVATAR_LABELS[key]} value={avatar[key]} onChange={(e) => setAvatar({ ...avatar, [key]: e.target.value })}>
                {AVATAR_OPTIONS[key].map((o) => <option key={o} value={o}>{avatarOptionLabel(key, o)}</option>)}
              </select>
            </label>
          ))}
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>Better, if you like, together.</h1>
          <p>Join a group, start one, or go solo. You can always join one later.</p>
          <div>
            <button type="button" disabled={saving} onClick={() => finish("join")}>Join a group</button>
            <button type="button" disabled={saving} onClick={() => finish("create")}>Create a group</button>
            <button type="button" disabled={saving} onClick={() => finish("solo")}>Continue solo</button>
          </div>
          {saveError && <p role="alert" data-error>{saveError}</p>}
        </section>
      )}

      <nav>
        {step > 0 && <button type="button" disabled={saving} onClick={() => setStep(step - 1)}>Back</button>}
        {step < STEPS.length - 1 && <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>}
      </nav>
    </main>
  );
}
