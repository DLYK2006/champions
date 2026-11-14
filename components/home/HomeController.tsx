"use client";
// Connects Jay's HomeScreen to real data. Replaces <DemoHome /> on the Home route once Jay agrees.
// No session or no profile -> /onboarding. Otherwise the real profile, today's progress and the group's
// progress feed HomeScreen's existing props. Refetches when the tab becomes visible again.
// Owner: @joshuatsou123.
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { HomeScreen } from "../ui/home-screen";
import { loadHome } from "../../lib/home";

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
    return () => document.removeEventListener("visibilitychange", onVisible);
  }, [load]);

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

  return <HomeScreen profile={data.profile} progress={data.progress} group={data.group} />;
}
