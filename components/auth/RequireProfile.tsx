"use client";
// Renders its children only for a signed-in user who has finished onboarding; everyone else goes to
// /onboarding. Keeps controllers from calling the database (and showing raw errors) before there is a user.
// Owner: @joshuatsou123.
import { useCallback, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import { accessState } from "../../lib/auth";

export default function RequireProfile({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const check = useCallback(
    () =>
      accessState()
        .then((state) => {
          if (state === "ready") {
            setReady(true);
            setError(null);
          } else {
            router.replace("/onboarding");
          }
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't check your account. Try again.")),
    [router],
  );
  useEffect(() => { void check(); }, [check]);

  if (ready) return <>{children}</>;
  return (
    <main>
      {error ? (
        <>
          <p role="alert">{error}</p>
          <button type="button" onClick={() => void check()}>Try again</button>
        </>
      ) : (
        <p role="status">One moment…</p>
      )}
    </main>
  );
}
