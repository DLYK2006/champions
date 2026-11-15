"use client";
// Connects Jay's HomeScreen to real data. Replaces <DemoHome /> on the Home route once Jay agrees.
// No session or no profile -> /onboarding. Otherwise the real profile, today's progress and the group's
// progress feed HomeScreen's existing props. Refetches when the tab becomes visible again and whenever
// settings, outfit or purchases change (onProfileUpdated). Opens the group celebration dialog for the
// full-bloom moment (lib/celebrate decides when).
// Owner: @joshuatsou123.
import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "../ui/home-screen";
import { AchievementDialog, type Achievement } from "../ui/achievement";
import { loadHome } from "../../lib/home";
import { onProfileUpdated } from "../../lib/settings/settings";
import { useGroupCelebration } from "../../lib/celebrate/useGroupCelebration";

type Ready = Extract<Awaited<ReturnType<typeof loadHome>>, { kind: "ready" }>;

export default function HomeController() {
  const router = useRouter();
  const [data, setData] = useState<Ready | null>(null);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(
    () =>
      loadHome()
        .then((result) => {
          if (result.kind === "onboarding") {
            router.replace("/onboarding");
            return;
          }
          setData(result);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't load your day. Try again.")),
    [router],
  );

  useEffect(() => {
    void load();
    // Coming back from the scan or another tab: show the latest meals and coins.
    const onVisible = () => { if (document.visibilityState === "visible") void load(); };
    document.addEventListener("visibilitychange", onVisible);
    // Profile settings, wardrobe or a purchase changed: show it on Home right away (PRD 14.1).
    const offProfile = onProfileUpdated(() => void load());
    return () => {
      document.removeEventListener("visibilitychange", onVisible);
      offProfile();
    };
  }, [load]);

  const { celebration, dismiss } = useGroupCelebration(
    data?.group,
    data?.progress.personal_goal_completed ?? false,
    data?.groupStatus?.group.name,
  );
  // Only the full-bloom moment opens a dialog on Home; smaller tiers show on Communities.
  // Memoised: AchievementDialog reopens whenever it gets a new object, so a re-render must not rebuild it.
  const members = data?.groupStatus?.members;
  const dialogId = celebration?.dialog ? `${celebration.key}:${celebration.tier}` : null;
  const { title = "", description = "", coins = 0 } = celebration ?? {};
  const achievement = useMemo<Achievement | null>(
    () => (dialogId ? { id: dialogId, title, description, coins, group: true, people: members ?? [] } : null),
    [dialogId, title, description, coins, members],
  );

  if (!data) {
    return (
      <main>
        {error ? (
          <>
            <p role="alert">{error}</p>
            <button type="button" onClick={() => void load()}>Try again</button>
          </>
        ) : (
          <p role="status">Opening your day…</p>
        )}
      </main>
    );
  }

  return (
    <>
      <HomeScreen profile={data.profile} progress={data.progress} group={data.group} />
      <AchievementDialog achievement={achievement} onClose={dismiss} />
    </>
  );
}
