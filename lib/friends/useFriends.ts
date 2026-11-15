"use client";
// The friends list and requests for the Friends view. Owner: @joshuatsou123.
// Friends change rarely, so this polls (no realtime) and every action is followed by a refetch.
import { useCallback, useEffect, useRef, useState } from "react";
import { listFriends } from "./api";
import type { FriendsOverview } from "./types";

const POLL_MS = 20_000;

export interface UseFriends {
  overview: FriendsOverview | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useFriends(): UseFriends {
  const [overview, setOverview] = useState<FriendsOverview | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);

  const refresh = useCallback(
    () =>
      listFriends()
        .then((next) => {
          if (!alive.current) return;
          setOverview(next);
          setError(null);
        })
        .catch((e: unknown) => {
          if (alive.current) setError(e instanceof Error ? e.message : "Couldn't load your friends");
        })
        .finally(() => {
          if (alive.current) setLoading(false);
        }),
    [],
  );

  useEffect(() => {
    alive.current = true;
    void refresh();
    const poll = setInterval(() => void refresh(), POLL_MS);
    return () => { alive.current = false; clearInterval(poll); };
  }, [refresh]);

  return { overview, loading, error, refresh };
}
