"use client";
// Once per member per group/day/tier. Remembered in localStorage, so a second device may show it again (fine).
// Usage: const { celebration, dismiss } = useGroupCelebration(groupProgress, myGoalDone, group.name);
//   Home: if (celebration?.dialog) open AchievementDialog({ title, description, coins, group: true, people: status.members }), onClose = dismiss.
//   Communities: pass celebration to CommunityScreen for the bloom/speech-bubble visuals; dismiss when they finish.
// Owner: @DLYK2006
import { useReducer } from "react";
import type { GroupDailyProgress } from "@/types";
import { celebrationFor, celebrationKey } from "./celebration";

function shownTier(key: string): number {
  try {
    return Number(localStorage.getItem(key)) || 0;
  } catch {
    return 0; // no storage (private mode / server render): the worst case is celebrating once more
  }
}

export function useGroupCelebration(progress: GroupDailyProgress | null | undefined, completedOwnGoal: boolean, groupName?: string) {
  const [, rerender] = useReducer((n: number) => n + 1, 0);
  const celebration = progress ? celebrationFor(progress, completedOwnGoal, shownTier(celebrationKey(progress)), groupName) : null;
  const dismiss = () => {
    if (!celebration) return;
    try {
      localStorage.setItem(celebration.key, String(celebration.tier));
    } catch {
      // storage unavailable: nothing to remember it in
    }
    rerender();
  };
  return { celebration, dismiss };
}
