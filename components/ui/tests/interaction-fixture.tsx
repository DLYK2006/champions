"use client";

import { useRef, useState } from "react";
import { CommunityScreen } from "../community-screen";
import { ShopScreen, demoShopItems } from "../shop-screen";
import { ResultsView } from "@/components/scan/results-view";
import { AchievementDialog } from "../achievement";
import { SpriteOptionsFixture } from "./sprite-options-fixture";
import type { ScanItem } from "@/types";

// Test-only fixture: imported solely by a temporary route created by pending.browser-check.cjs.
export default function InteractionFixture() {
  const rejectRequest = useRef<((reason: Error) => void) | null>(null);
  const [calls, setCalls] = useState(0);
  const [celebrating, setCelebrating] = useState(false);
  const [mode, setMode] = useState<"group" | "results" | "shop">("group");
  const [item, setItem] = useState<ScanItem>({
    name: "Test meal",
    portion: "1 serving",
    grams: 100,
    calories: 200,
    protein_g: 20,
    carbs_g: 15,
    fat_g: 7,
    confidence: "high",
  });
  function pendingRequest(): Promise<void> {
    setCalls((value) => value + 1);
    return new Promise((_resolve, reject) => {
      rejectRequest.current = reject;
    });
  }
  return (
    <>
      <SpriteOptionsFixture />
      <button className="button" onClick={() => setCelebrating(true)}>
        Celebration fixture
      </button>
      <AchievementDialog
        achievement={
          celebrating
            ? {
                id: "fixture",
                title: "Goal complete!",
                description: "Personal goal reached.",
                coins: 10,
                preview: true,
              }
            : null
        }
        onClose={() => setCelebrating(false)}
      />
      <button
        className="button"
        onClick={() =>
          rejectRequest.current?.(
            new Error("The request failed. Please retry."),
          )
        }
      >
        Reject pending request
      </button>
      <output aria-label="Request count">{calls}</output>
      <button className="button" onClick={() => setMode("results")}>
        Results fixture
      </button>
      <button className="button" onClick={() => setMode("shop")}>
        Shop fixture
      </button>
      {mode === "group" ? (
        <CommunityScreen
          group={null}
          progress={null}
          members={[]}
          onCreate={pendingRequest}
          onJoin={pendingRequest}
          onExploreSolo={() => {}}
        />
      ) : mode === "results" ? (
        <ResultsView
          result={{
            items: [item],
            total: {
              calories: item.calories,
              protein_g: item.protein_g,
              carbs_g: item.carbs_g,
              fat_g: item.fat_g,
            },
            overall_confidence: "high",
            coach_tip: "Add a protein source to round out this meal.",
          }}
          mealType="lunch"
          onMealType={() => {}}
          onUpdate={(_index, patch) =>
            setItem((current) => ({ ...current, ...patch }))
          }
          onRemove={() => {}}
          onAdd={() => {}}
          onBack={() => {}}
          onConfirm={pendingRequest}
        />
      ) : (
        <ShopScreen
          balance={240}
          owned={[]}
          equipped={[]}
          items={demoShopItems}
          onBuy={pendingRequest}
        />
      )}
    </>
  );
}
