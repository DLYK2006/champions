"use client";
// Sends someone who already finished onboarding straight Home. Mounted in app/onboarding/layout.tsx so it runs
// on the welcome screen too (the flow itself only mounts after "Start your adventure"). Renders nothing.
// Owner: @joshuatsou123.
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { accessState } from "../../lib/auth";

export default function OnboardingGate() {
  const router = useRouter();
  useEffect(() => {
    void accessState()
      .then((state) => { if (state === "ready") router.replace("/"); })
      .catch(() => undefined); // can't tell: let them continue; the save handles conflicts
  }, [router]);
  return null;
}
