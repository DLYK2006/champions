import type { ReactNode } from "react";
import { WelcomeShell } from "@/components/onboarding/welcome-shell";
import { OnboardingGate } from "@/components/onboarding";
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return (
    <>
      <OnboardingGate />
      <WelcomeShell>{children}</WelcomeShell>
    </>
  );
}
