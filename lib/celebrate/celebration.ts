// When and how a member celebrates their group's tier (PRD P1 group celebration, option C). Owner: @DLYK2006
// Pure: no React, no storage, so node --test can run it. Cozy copy only: no blame, no comparing members (PRD 9.5).
import type { GroupDailyProgress } from "@/types";

export type Tier = 10 | 20 | 30;
export interface Celebration {
  key: string; // group + date: what "already shown" is remembered under
  tier: Tier;
  coins: number; // group coins this member earned today (0 if their own goal isn't done yet)
  title: string;
  description: string; // the dialog text; the coin number lives in the dialog's reward pill
  line: string; // the soft line under the garden
  dialog: boolean; // Home opens the AchievementDialog only for the full-bloom moment you were paid for
}

export const celebrationKey = (p: Pick<GroupDailyProgress, "group_id" | "date">) => `digin:celebrated:${p.group_id}:${p.date}`;

export function celebrationFor(
  progress: Pick<GroupDailyProgress, "group_id" | "date" | "bonus_tier"> | null | undefined,
  completedOwnGoal: boolean,
  alreadyShownTier: number,
  groupName = "your group",
): Celebration | null {
  const tier = progress?.bonus_tier ?? 0;
  if (!progress || tier === 0 || tier <= alreadyShownTier) return null;
  const coins = completedOwnGoal ? tier : 0;
  const full = tier === 30;
  return {
    key: celebrationKey(progress),
    tier,
    coins,
    title: full ? "Your whole group made it!" : "Your garden is growing!",
    description: full
      ? `Everyone in ${groupName} reached their goal today. Your garden is in full bloom.`
      : `${groupName} is growing together today.`,
    line: full
      ? "Your garden is in full bloom · +30 coins each"
      : coins
        ? `The garden is growing · +${coins} for you`
        : "The garden is growing",
    dialog: full && completedOwnGoal,
  };
}
