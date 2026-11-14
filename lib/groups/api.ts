// Typed wrappers over the group RPCs (supabase/migrations/0002_groups.sql). Owner: @joshuatsou123.
// Every function throws an Error whose message is safe to show the user (the SQL raises friendly text).
import { createClient } from "../supabase/client";
import type { Group } from "../../types/index";
import type { GroupStatus } from "./types";

const pad = (n: number) => String(n).padStart(2, "0");
/** The user's local calendar date as YYYY-MM-DD, the same value log_meal receives as p_date. */
export const localDate = (d: Date = new Date()) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;

const FRIENDLY: Record<string, string> = {
  "not signed in": "Sign in to use groups",
  "no profile": "Finish onboarding first",
};

function fail(message: string): never {
  // Without a session Postgres says "permission denied for function ..."; never show that raw.
  if (/permission denied/i.test(message)) throw new Error(FRIENDLY["not signed in"]);
  throw new Error(FRIENDLY[message] ?? message);
}

export async function createGroup(name: string, badge: string): Promise<Group> {
  const { data, error } = await createClient().rpc("create_group", { p_name: name, p_badge: badge });
  if (error) fail(error.message);
  return data as Group;
}

export async function joinGroup(code: string): Promise<Group> {
  const { data, error } = await createClient().rpc("join_group", { p_code: code });
  if (error) fail(error.message);
  return data as Group;
}

export async function leaveGroup(): Promise<void> {
  const { error } = await createClient().rpc("leave_group");
  if (error) fail(error.message);
}

/** The caller's group with live completion and member statuses, or null when not in a group. */
export async function getGroupStatus(date: string = localDate()): Promise<GroupStatus | null> {
  const { data, error } = await createClient().rpc("get_group_status", { p_date: date });
  if (error) fail(error.message);
  return (data as GroupStatus | null) ?? null;
}
