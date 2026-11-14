"use client";
// Live group status for the Groups page. Owner: @joshuatsou123.
// Subscribes to postgres_changes on group_daily_progress and group_members (RLS limits both to the caller's
// group), refetches get_group_status on every event, and polls as a safety net so a dropped websocket
// can't leave the demo stale.
import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "../supabase/client";
import { getGroupStatus, localDate } from "./api";
import type { GroupStatus } from "./types";

const POLL_MS = 15_000;

export interface UseGroupLive {
  /** null = not in a group (or still loading, see `loading`). */
  status: GroupStatus | null;
  loading: boolean;
  error: string | null;
  refresh: () => Promise<void>;
}

export function useGroupLive(): UseGroupLive {
  const [status, setStatus] = useState<GroupStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const alive = useRef(true);
  const groupId = status?.group.id ?? null;

  const refresh = useCallback(
    () =>
      getGroupStatus(localDate())
        .then((next) => {
          if (!alive.current) return;
          setStatus(next);
          setError(null);
        })
        .catch((e: unknown) => {
          if (alive.current) setError(e instanceof Error ? e.message : "Couldn't load your group");
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

  // (Re)subscribe whenever the user's group changes (join, create, leave).
  useEffect(() => {
    if (!groupId) return;
    const supabase = createClient();
    const filter = `group_id=eq.${groupId}`;
    const channel = supabase
      .channel(`group:${groupId}`)
      .on("postgres_changes", { event: "*", schema: "public", table: "group_daily_progress", filter }, () => void refresh())
      .on("postgres_changes", { event: "*", schema: "public", table: "group_members", filter }, () => void refresh())
      .subscribe();
    return () => { void supabase.removeChannel(channel); };
  }, [groupId, refresh]);

  return { status, loading, error, refresh };
}
