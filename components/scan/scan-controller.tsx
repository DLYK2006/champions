"use client";
// Real scan flow: photo -> /api/scan -> editable results -> log_meal. Owner: @DLYK2006 (views by @haojay1126).

import { useEffect, useState } from "react";
import Link from "next/link";
import type { Confidence, LogMealResponse, MealType, ScanItem } from "@/types";
import { createClient } from "@/lib/supabase/client";
import { sumMacros } from "@/lib/scan";
import { resizeToJpegBase64 } from "@/lib/scan/resize";
import { ScanView } from "./scan-view";
import { ResultsView } from "./results-view";
import { AchievementDialog, type Achievement } from "@/components/ui/achievement";

const blankItem = (): ScanItem => ({
  name: "", portion: "1 serving", grams: 0, calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0, confidence: "low",
});
const localDate = () => new Date().toLocaleDateString("en-CA"); // YYYY-MM-DD in the user's timezone

export function ScanController() {
  const [view, setView] = useState<"ready" | "scanning" | "results" | "error">("ready");
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string>();
  const [items, setItems] = useState<ScanItem[]>([]);
  const [overall, setOverall] = useState<Confidence>("low");
  const [coachTip, setCoachTip] = useState<string | null>(null);
  const [mealType, setMealType] = useState<MealType>("lunch");
  const [eventId, setEventId] = useState("");
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [signedIn, setSignedIn] = useState<boolean | null>(null);

  useEffect(() => {
    createClient().auth.getSession().then(({ data }) => setSignedIn(!!data.session));
  }, []);

  function showResults(next: ScanItem[], confidence: Confidence, tip: string | null) {
    setItems(next);
    setOverall(confidence);
    setCoachTip(tip);
    setEventId(crypto.randomUUID()); // one id per result, so a retried confirm can't log twice
    setView("results");
  }

  function reset() {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(undefined);
    setItems([]);
    setView("ready");
  }

  async function onFile(file: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(URL.createObjectURL(file));
    setView("scanning");
    try {
      const { data } = await createClient().auth.getSession();
      if (!data.session) throw new Error("Set up your profile first (link above), then scan.");
      const res = await fetch("/api/scan", {
        method: "POST",
        headers: { authorization: `Bearer ${data.session.access_token}`, "content-type": "application/json" },
        body: JSON.stringify({ image_base64: await resizeToJpegBase64(file), mime_type: "image/jpeg" }),
      });
      const body = await res.json();
      if (!res.ok) throw new Error(body.error ?? "Couldn't estimate this meal.");
      showResults(body.items, body.overall_confidence, body.coach_tip);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't estimate this meal.");
      setView("error");
    }
  }

  async function onConfirm() {
    const { data, error } = await createClient().rpc("log_meal", {
      p_event_id: eventId, p_date: localDate(), p_meal_type: mealType, p_items: items,
    });
    if (error) throw new Error(`Your meal wasn't saved: ${error.message}`);
    const r = data as LogMealResponse;
    const coins = r.coins_awarded.reduce((s, c) => s + c.amount, 0);
    setAchievement({
      id: eventId,
      title: r.progress.personal_goal_completed ? "Personal goal complete!" : "Meal logged.",
      description: coins ? `You earned ${coins} coins. Balance: ${r.coin_balance}.` : `Balance: ${r.coin_balance} coins.`,
      coins,
      group: (r.group?.bonus_tier ?? 0) > 0,
    });
  }

  return (
    <>
      {signedIn === false && (
        <p className="scan-demo-notice" role="status">
          You need a profile before scanning. <Link href="/onboarding">Set up your profile →</Link>
        </p>
      )}
      {view === "results" ? (
        <ResultsView
          result={{ items, total: sumMacros(items), overall_confidence: overall, coach_tip: coachTip }}
          mealType={mealType}
          previewUrl={previewUrl}
          onMealType={setMealType}
          onUpdate={(index, patch) => setItems((cur) => cur.map((it, i) => (i === index ? { ...it, ...patch } : it)))}
          onRemove={(index) => setItems((cur) => cur.filter((_, i) => i !== index))}
          onAdd={() => setItems((cur) => [...cur, blankItem()])}
          onBack={reset}
          onConfirm={onConfirm}
        />
      ) : (
        <ScanView
          status={view}
          error={error}
          previewUrl={previewUrl}
          onFile={onFile}
          onManual={() => showResults([blankItem()], "low", null)}
          onRetry={reset}
        />
      )}
      <AchievementDialog
        achievement={achievement}
        onClose={() => {
          setAchievement(null);
          reset();
        }}
      />
    </>
  );
}
