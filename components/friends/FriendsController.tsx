"use client";
// The Friends view for the Communities tab (PRD 11.1-11.3): search by username, mutual requests, a friend
// list with streaks, and a friend's calendar. Plain markup; Jay styles it and mounts it behind the
// Group/Friends toggle. Friends never see anything but username, streak and goal/logged days.
// Owner: @joshuatsou123.
import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";
import {
  getFriendCalendar, monthRange, removeFriend, respondToRequest, searchTerm, searchUsers, sendFriendRequest,
  statusByDate, useFriends,
  type FriendCalendar, type FriendSummary, type SearchResult,
} from "../../lib/friends";
import { monthCells } from "../../lib/history/calendar";
import { RequireProfile } from "../auth";

export default function FriendsController() {
  return (
    <RequireProfile>
      <FriendsView />
    </RequireProfile>
  );
}

const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];
const MARK = { goal: "Goal met", logged: "Logged", none: "" } as const;

function FriendsView() {
  const { overview, loading, error, refresh } = useFriends();
  const [notice, setNotice] = useState<string | null>(null);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<SearchResult[] | null>(null);
  const [searching, setSearching] = useState(false);
  const [openFriend, setOpenFriend] = useState<FriendSummary | null>(null);
  const busy = useRef(false);

  // Runs one action at a time, then refreshes the list and the open search so buttons reflect the new state.
  const act = useCallback(async (fn: () => Promise<unknown>, after?: () => Promise<unknown>) => {
    if (busy.current) return;
    busy.current = true;
    setNotice(null);
    try {
      await fn();
      await Promise.all([refresh(), after?.()]);
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Something went wrong. Try again.");
    } finally {
      busy.current = false;
    }
  }, [refresh]);

  const runSearch = useCallback(async (text: string) => {
    const term = searchTerm(text);
    if (!term) { setResults(null); return; }
    setSearching(true);
    try {
      setResults(await searchUsers(term));
    } catch (e) {
      setNotice(e instanceof Error ? e.message : "Couldn't search. Try again.");
    } finally {
      setSearching(false);
    }
  }, []);

  function onSearch(e: FormEvent) {
    e.preventDefault();
    if (!searchTerm(query)) { setNotice("Type at least 3 letters of a username."); return; }
    setNotice(null);
    void runSearch(query);
  }

  if (!overview && loading) return <main><p role="status">Finding your friends…</p></main>;
  if (!overview && error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => void refresh()}>Try again</button>
      </main>
    );
  }
  const { friends = [], incoming = [], outgoing = [] } = overview ?? {};

  if (openFriend) {
    return (
      <FriendCalendarView
        friend={openFriend}
        onBack={() => setOpenFriend(null)}
        onRemoved={() => { setOpenFriend(null); void refresh(); }}
      />
    );
  }

  return (
    <main>
      <h1>Friends</h1>
      {notice && <p role="alert">{notice}</p>}

      <form onSubmit={onSearch}>
        <label>Find a friend by username
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Username" autoCapitalize="none" autoCorrect="off" />
        </label>
        <button type="submit" disabled={searching}>{searching ? "Searching…" : "Search"}</button>
      </form>
      {results && (
        results.length === 0 ? <p>No one found with that username.</p> : (
          <ul aria-label="Search results">
            {results.map((r) => (
              <li key={r.user_id}>
                {r.username}{" "}
                {r.relation === "none" && (
                  <button type="button" onClick={() => void act(() => sendFriendRequest(r.user_id), () => runSearch(query))}>Add</button>
                )}
                {r.relation === "incoming" && (
                  <button type="button" onClick={() => void act(() => respondToRequest(r.user_id, true), () => runSearch(query))}>Accept request</button>
                )}
                {r.relation === "outgoing" && <span>Request sent</span>}
                {r.relation === "friend" && <span>Friends</span>}
              </li>
            ))}
          </ul>
        )
      )}

      {incoming.length > 0 && (
        <section aria-label="Friend requests">
          <h2>Requests</h2>
          <ul>
            {incoming.map((r) => (
              <li key={r.user_id}>
                {r.username}{" "}
                <button type="button" onClick={() => void act(() => respondToRequest(r.user_id, true))}>Accept</button>{" "}
                <button type="button" onClick={() => void act(() => respondToRequest(r.user_id, false))}>Decline</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      {outgoing.length > 0 && (
        <section aria-label="Sent requests">
          <h2>Sent</h2>
          <ul>
            {outgoing.map((r) => (
              <li key={r.user_id}>
                {r.username} (waiting){" "}
                <button type="button" onClick={() => void act(() => removeFriend(r.user_id))}>Cancel</button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section aria-label="Your friends">
        <h2>Your friends</h2>
        {friends.length === 0 ? (
          <p>No friends yet. Search for a username to add one.</p>
        ) : (
          <ul>
            {friends.map((f) => (
              <li key={f.user_id}>
                <button type="button" onClick={() => setOpenFriend(f)}>{f.username}</button>{" "}
                <span>{f.streak > 0 ? `${f.streak}-day streak` : "No streak yet"}</span>
              </li>
            ))}
          </ul>
        )}
      </section>
    </main>
  );
}

function FriendCalendarView({ friend, onBack, onRemoved }: { friend: FriendSummary; onBack: () => void; onRemoved: () => void }) {
  const now = new Date();
  const [ym, setYm] = useState({ year: now.getFullYear(), month: now.getMonth() });
  const [cal, setCal] = useState<FriendCalendar | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [removing, setRemoving] = useState(false);

  useEffect(() => {
    let live = true;
    const { from, to } = monthRange(ym.year, ym.month);
    getFriendCalendar(friend.user_id, from, to)
      .then((c) => { if (live) { setCal(c); setError(null); } })
      .catch((e: unknown) => { if (live) setError(e instanceof Error ? e.message : "Couldn't load their calendar."); });
    return () => { live = false; };
  }, [friend.user_id, ym]);

  function step(delta: number) {
    setCal(null);
    setYm((v) => {
      const d = new Date(v.year, v.month + delta, 1);
      return { year: d.getFullYear(), month: d.getMonth() };
    });
  }
  async function remove() {
    if (removing) return;
    if (!window.confirm(`Remove ${friend.username} from your friends?`)) return;
    setRemoving(true);
    try {
      await removeFriend(friend.user_id);
      onRemoved(); // back to the list, refreshed so they are gone straight away
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't remove them. Try again.");
      setRemoving(false);
    }
  }

  const status = cal ? statusByDate(cal) : null;
  return (
    <main>
      <button type="button" onClick={onBack}>Back</button>
      <h1>{friend.username}</h1>
      <p>{(cal?.streak ?? friend.streak) > 0 ? `${cal?.streak ?? friend.streak}-day streak` : "No streak yet"}</p>
      {error && <p role="alert">{error}</p>}
      <p>
        <button type="button" aria-label="Previous month" onClick={() => step(-1)}>‹</button>{" "}
        <strong>{MONTHS[ym.month]} {ym.year}</strong>{" "}
        <button type="button" aria-label="Next month" onClick={() => step(1)}>›</button>
      </p>
      {!cal && !error ? (
        <p role="status">Loading…</p>
      ) : (
        <ol aria-label="Calendar" style={{ display: "grid", gridTemplateColumns: "repeat(7, 1fr)", gap: 4, listStyle: "none", padding: 0 }}>
          {monthCells(ym.year, ym.month).map((date, i) =>
            date === null ? <li key={`b${i}`} aria-hidden /> : (
              <li key={date} title={status ? MARK[status(date)] : ""} data-status={status ? status(date) : "none"} style={{ textAlign: "center" }}>
                {Number(date.slice(8))}
                <br />
                <span aria-label={status ? MARK[status(date)] || "No log" : undefined}>
                  {status?.(date) === "goal" ? "●" : status?.(date) === "logged" ? "○" : "·"}
                </span>
              </li>
            ),
          )}
        </ol>
      )}
      <p><small>● goal met · ○ logged · · nothing logged</small></p>
      <button type="button" onClick={() => void remove()} disabled={removing}>Remove friend</button>
    </main>
  );
}
