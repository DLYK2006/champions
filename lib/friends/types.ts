// Shapes returned by the friends RPCs (supabase/migrations/0004_friends.sql). Friends never carry calories,
// macros, meals, weight, targets, avatar or group (PRD 11.3). Owner: @joshuatsou123.
export type Relation = "none" | "friend" | "outgoing" | "incoming";
export type FriendDayStatus = "goal" | "logged";

export interface SearchResult { user_id: string; username: string; relation: Relation }
export interface FriendSummary { user_id: string; username: string; streak: number }
export interface FriendRequest { user_id: string; username: string }
export interface FriendsOverview { friends: FriendSummary[]; incoming: FriendRequest[]; outgoing: FriendRequest[] }
export interface FriendCalendar {
  user_id: string;
  username: string;
  streak: number;
  /** One row per day marked goal or logged; quiet days are simply absent (shown neutrally). */
  days: { date: string; status: FriendDayStatus }[];
}
