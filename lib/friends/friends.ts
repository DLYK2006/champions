// Friends logic with no React or Supabase, so it can be unit tested. Owner: @joshuatsou123.
import type { DayStatus } from "../history/calendar"; // type only: the month grid itself uses monthCells from there
import type { FriendCalendar } from "./types";

export const MIN_SEARCH = 3;

const pad = (n: number) => String(n).padStart(2, "0");
const ymd = (year: number, month: number, day: number) => `${year}-${pad(month + 1)}-${pad(day)}`; // month is 0-based

/** The search text to send, or null while it is too short to search. */
export function searchTerm(input: string): string | null {
  const q = input.trim();
  return q.length >= MIN_SEARCH ? q : null;
}

/** The SQL raises lower-case messages; show them as sentences. Raw permission errors are never shown. */
export function friendlyFriendsError(message: string): string {
  if (/permission denied/i.test(message)) return "Sign in to use friends";
  const m = message.trim();
  if (!m) return "Something went wrong. Try again.";
  return m.charAt(0).toUpperCase() + m.slice(1) + (/[.!?]$/.test(m) ? "" : ".");
}

/** First and last day (YYYY-MM-DD) of a month, month 0-based: the range to ask get_friend_calendar for. */
export function monthRange(year: number, month: number): { from: string; to: string } {
  return { from: ymd(year, month, 1), to: ymd(year, month, new Date(year, month + 1, 0).getDate()) };
}

/** date -> status lookup for a month grid; days that are not listed are "none". */
export function statusByDate(cal: Pick<FriendCalendar, "days">): (date: string) => DayStatus {
  const map = new Map(cal.days.map((d) => [d.date, d.status] as const));
  return (date) => map.get(date) ?? "none";
}
