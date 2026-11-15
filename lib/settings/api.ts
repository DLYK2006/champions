// Profile settings data: load and save the signed-in user's own settings, sign out, delete the account.
// Owner: @joshuatsou123. Coins, streak and equipped items are never touched here (clients can't write them).
import { createClient } from "../supabase/client";
import {
  SETTINGS_COLUMNS, SettingsValidationError, normalizeSettings, notifyProfileUpdated, toSettings, validateSettings,
} from "./settings";
import type { SettingsProfile } from "./types";

async function currentUserId(): Promise<string> {
  const { data } = await createClient().auth.getSession();
  const id = data.session?.user.id;
  if (!id) throw new Error("Sign in to change your settings.");
  return id;
}

export async function loadSettings(): Promise<SettingsProfile> {
  const id = await currentUserId();
  const { data, error } = await createClient().from("profiles").select(SETTINGS_COLUMNS).eq("id", id).maybeSingle();
  if (error) throw new Error("Couldn't load your settings. Try again.");
  if (!data) throw new Error("Finish onboarding first.");
  return toSettings(data as unknown as Record<string, unknown>);
}

/** Validates with the onboarding rules, saves, and tells the rest of the app the profile changed.
 *  Throws SettingsValidationError (with .fields) for bad input, or an Error with a user-safe message. */
export async function saveSettings(input: SettingsProfile): Promise<SettingsProfile> {
  const check = validateSettings(input);
  if (!check.valid) throw new SettingsValidationError(check.fields);
  const id = await currentUserId();
  const { data, error } = await createClient()
    .from("profiles").update(normalizeSettings(input)).eq("id", id).select(SETTINGS_COLUMNS).maybeSingle();
  if (error) {
    if (error.code === "23505" && /username/i.test(error.message)) throw new Error("That username is taken.");
    throw new Error("Couldn't save your settings. Try again.");
  }
  if (!data) throw new Error("Couldn't save your settings. Try again.");
  notifyProfileUpdated();
  return toSettings(data as unknown as Record<string, unknown>);
}

export async function signOut(): Promise<void> {
  const { error } = await createClient().auth.signOut();
  if (error) throw new Error("Couldn't sign out. Try again.");
}

/** Permanently deletes the account and all its data (DELETE /api/account, Daren). The user must type their
 *  username; the server checks it too. Signs out locally afterwards. */
export async function deleteAccount(confirmUsername: string): Promise<void> {
  const supabase = createClient();
  const { data } = await supabase.auth.getSession();
  const token = data.session?.access_token;
  if (!token) throw new Error("Sign in first.");
  const res = await fetch("/api/account", {
    method: "DELETE",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({ confirm_username: confirmUsername }),
  });
  if (res.status !== 204) {
    const body = (await res.json().catch(() => null)) as { error?: string } | null;
    throw new Error(body?.error ?? "Couldn't delete your account. Try again.");
  }
  await supabase.auth.signOut().catch(() => undefined); // the user is gone; clear the local session either way
}
