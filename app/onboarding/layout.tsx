import type { ReactNode } from "react";
import { WelcomeShell } from "@/components/onboarding/welcome-shell";
export default function OnboardingLayout({
  children,
}: {
  children: ReactNode;
}) {
  return <WelcomeShell>{children}</WelcomeShell>;
}
