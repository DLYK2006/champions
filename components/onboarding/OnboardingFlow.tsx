"use client";
// Onboarding: body stats -> goal -> nutrition targets -> avatar -> optional group step.
// Logic only, plain markup. Jay restyles this folder after (see board). Rules: lib/targets.
import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "../../lib/supabase/client";
import type { Avatar, GoalType } from "../../types/index";
import {
  ADULTS_ONLY_MESSAGE, PRESETS_DISCLAIMER, RANGES, cmFromFeetInches, kgFromLb, lbFromKg, feetInchesFromCm,
  presetsForGoal, resolveTargetWeight, round1, validateAge, validateBodyStats, validateCalories, validateGoal,
  validateOnboarding, validateOptionalMacro, validateProtein, type FieldResult, type Units,
} from "../../lib/targets";
import { createGroup, joinGroup } from "../../lib/groups/api";
import { GROUP_BADGES, DEFAULT_BADGE, peekPendingCode, clearPendingCode } from "../../lib/groups/invite";
import { DEFAULT_AVATAR } from "./avatarOptions";
import { AvatarCustomizer } from "../avatar/avatar-customizer";
import { Icon } from "../ui/icons";

const STEPS = ["Body stats", "Goal", "Nutrition targets", "Avatar", "Group"] as const;
const USERNAME_RE = /^[a-zA-Z0-9_]{3,20}$/;
type GroupMode = "choose" | "join" | "create" | "created";

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
  // group step: the profile is saved once, then Join / Create / Solo all build on it
  const [profileSaved, setProfileSaved] = useState(false);
  const [groupMode, setGroupMode] = useState<GroupMode>(() => (peekPendingCode() ? "join" : "choose")); // an invite link opens straight on Join
  const [joinCode, setJoinCode] = useState(() => peekPendingCode() ?? "");
  const [groupName, setGroupName] = useState("");
  const [groupBadge, setGroupBadge] = useState<string>(DEFAULT_BADGE);
  const [groupError, setGroupError] = useState<string | null>(null);
  const [createdCode, setCreatedCode] = useState<string | null>(null);

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
  const [avatar, setAvatar] = useState<Avatar>(DEFAULT_AVATAR);

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
    if (profileSaved) return true; // never insert twice (a failed group call must not redo this)
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
      if (error.code === "23505" && /username/i.test(error.message)) {
        setSaveError("That username is taken. Go back and pick another.");
        return false;
      }
      if (error.code === "23505") { // profiles_pkey: this account is already onboarded, carry on with it
        setProfileSaved(true);
        return true;
      }
      setSaveError("Couldn't save your profile. Try again.");
      return false;
    }
    setProfileSaved(true);
    return true;
  }

  const goHome = () => router.push("/");

  // Continue solo: just save and go. Equally prominent with Join / Create (PRD 4.5).
  async function continueSolo() {
    setSaving(true);
    const saved = await saveProfile();
    setSaving(false);
    if (saved) goHome();
  }

  // Join / Create: save the profile first (groups need one). If the group call fails the profile stays
  // saved, the user sees the reason, and can retry, switch option, or continue solo.
  async function submitGroup(mode: "join" | "create") {
    setGroupError(null);
    setSaving(true);
    try {
      if (!(await saveProfile())) return;
      if (mode === "join") {
        await joinGroup(joinCode);
        clearPendingCode();
        goHome();
      } else {
        const g = await createGroup(groupName, groupBadge);
        setCreatedCode(g.invite_code);
        setGroupMode("created");
      }
    } catch (e) {
      setGroupError(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      setSaving(false);
    }
  }

  const joinOk = joinCode.trim().length === 6;
  const createOk = groupName.trim().length >= 1 && groupName.trim().length <= 30;

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
            {([{ id: 'bulk', title: 'Bulk', copy: 'Build and grow', icon: 'meat' }, { id: 'cut', title: 'Cut', copy: 'A mindful change', icon: 'carrot' }, { id: 'maintain', title: 'Maintain', copy: 'Find your rhythm', icon: 'sun' }] as const).map(choice => <button key={choice.id} type="button" aria-pressed={goal === choice.id} onClick={() => pickGoal(choice.id)}><Icon name={choice.icon} size={27} /><strong>{choice.title}</strong><span>{choice.copy}</span></button>)}
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
          <AvatarCustomizer value={avatar} onChange={setAvatar} />
        </section>
      )}

      {step === 4 && (
        <section>
          <h1 ref={headingRef} tabIndex={-1}>Better, if you like, together.</h1>
          {groupMode === "choose" && (
            <>
              <p>Join a group, start one, or go solo. You can always join one later.</p>
              <div>
                <button type="button" disabled={saving} onClick={() => setGroupMode("join")}>Join a group</button>
                <button type="button" disabled={saving} onClick={() => setGroupMode("create")}>Create a group</button>
                <button type="button" disabled={saving} onClick={continueSolo}>Continue solo</button>
              </div>
            </>
          )}

          {groupMode === "join" && (
            <>
              <label>Invite code
                <input
                  value={joinCode}
                  onChange={(e) => setJoinCode(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, "").slice(0, 6))}
                  maxLength={6}
                  autoCapitalize="characters"
                  autoComplete="off"
                />
              </label>
              <div>
                <button type="button" disabled={saving || !joinOk} onClick={() => submitGroup("join")}>Join</button>
                <button type="button" disabled={saving} onClick={() => { setGroupMode("choose"); setGroupError(null); }}>Back</button>
                <button type="button" disabled={saving} onClick={continueSolo}>Continue solo</button>
              </div>
            </>
          )}

          {groupMode === "create" && (
            <>
              <label>Group name
                <input value={groupName} onChange={(e) => setGroupName(e.target.value)} maxLength={30} />
              </label>
              <label>Badge
                <select value={groupBadge} onChange={(e) => setGroupBadge(e.target.value)}>
                  {GROUP_BADGES.map((b) => <option key={b} value={b}>{b}</option>)}
                </select>
              </label>
              <div>
                <button type="button" disabled={saving || !createOk} onClick={() => submitGroup("create")}>Create group</button>
                <button type="button" disabled={saving} onClick={() => { setGroupMode("choose"); setGroupError(null); }}>Back</button>
                <button type="button" disabled={saving} onClick={continueSolo}>Continue solo</button>
              </div>
            </>
          )}

          {groupMode === "created" && (
            <>
              <p>Your group is ready. Share this invite code with friends (up to 4 members):</p>
              <p data-invite-code>{createdCode}</p>
              <button type="button" onClick={goHome}>Continue</button>
            </>
          )}

          {groupError && <p role="alert" data-error>{groupError}</p>}
          {saveError && <p role="alert" data-error>{saveError}</p>}
        </section>
      )}

      <nav>
        {step > 0 && !profileSaved && <button type="button" disabled={saving} onClick={() => setStep(step - 1)}>Back</button>}
        {step < STEPS.length - 1 && <button type="button" disabled={!canNext} onClick={() => setStep(step + 1)}>Next</button>}
      </nav>
    </main>
  );
}
