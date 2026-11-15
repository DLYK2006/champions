// Who is looking at the app? Shared by Home, Shop, Groups and onboarding so a signed-out or not-yet-onboarded
// visitor is sent to /onboarding instead of seeing a half-working screen. Owner: @joshuatsou123.
import { createClient } from "../supabase/client";

export type AccessState = "signed-out" | "no-profile" | "ready";

/** No session -> "signed-out"; session but no profile row -> "no-profile"; otherwise "ready". */
export async function accessState(): Promise<AccessState> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  if (!data.session) return "signed-out";
  const { data: profile, error } = await supabase.from("profiles").select("id").maybeSingle();
  if (error) throw new Error("Couldn't check your account. Try again.");
  return profile ? "ready" : "no-profile";
}
