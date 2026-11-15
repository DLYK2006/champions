// Typed wrappers over the friends RPCs (supabase/migrations/0004_friends.sql). Owner: @joshuatsou123.
// Every function throws an Error whose message is safe to show the user.
import { createClient } from "../supabase/client";
import { localDate } from "../groups/api";
import { friendlyFriendsError } from "./friends";
import type { FriendCalendar, FriendsOverview, SearchResult } from "./types";

function fail(message: string): never {
  throw new Error(friendlyFriendsError(message));
}

export async function searchUsers(query: string): Promise<SearchResult[]> {
  const { data, error } = await createClient().rpc("search_users", { p_query: query });
  if (error) fail(error.message);
  return (data as SearchResult[] | null) ?? [];
}

/** Returns "accepted" when they had already asked you (the request becomes a friendship), else "pending". */
export async function sendFriendRequest(userId: string): Promise<"pending" | "accepted"> {
  const { data, error } = await createClient().rpc("send_friend_request", { p_user: userId });
  if (error) fail(error.message);
  return (data as { status: "pending" | "accepted" }).status;
}

export async function respondToRequest(requesterId: string, accept: boolean): Promise<void> {
  const { error } = await createClient().rpc("respond_friend_request", { p_requester: requesterId, p_accept: accept });
  if (error) fail(error.message);
}

/** Removes a friend, cancels a request you sent, or declines one sent to you. */
export async function removeFriend(userId: string): Promise<void> {
  const { error } = await createClient().rpc("remove_friend", { p_user: userId });
  if (error) fail(error.message);
}

export async function listFriends(today: string = localDate()): Promise<FriendsOverview> {
  const { data, error } = await createClient().rpc("list_friends", { p_today: today });
  if (error) fail(error.message);
  const d = (data ?? {}) as Partial<FriendsOverview>;
  return { friends: d.friends ?? [], incoming: d.incoming ?? [], outgoing: d.outgoing ?? [] };
}

export async function getFriendCalendar(friendId: string, from: string, to: string, today: string = localDate()): Promise<FriendCalendar> {
  const { data, error } = await createClient().rpc("get_friend_calendar", {
    p_friend: friendId, p_from: from, p_to: to, p_today: today,
  });
  if (error) fail(error.message);
  return data as FriendCalendar;
}
