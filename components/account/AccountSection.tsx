"use client";
// Profile > Account (PRD 14.1): sign out and return to the welcome screen. Owner: @DLYK2006.
// Uses Josh's lib/settings signOut. Delete account was dropped by Daren (Nov 15).
// Usage in Profile: <AccountSection />. Plain markup with the app's classes; Jay styles it.
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signOut } from "@/lib/settings";

export function AccountSection() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function onSignOut() {
    setBusy(true);
    setError(null);
    try {
      await signOut();
      router.replace("/onboarding");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't sign out. Try again.");
      setBusy(false);
    }
  }

  return (
    <section className="panel account-section space-y-3" aria-labelledby="account-title">
      <h3 id="account-title">Account</h3>
      {error && <p className="field-error" role="alert">{error}</p>}
      <button type="button" className="button button-soft" onClick={onSignOut} disabled={busy}>
        {busy ? "Signing out…" : "Sign out"}
      </button>
    </section>
  );
}
