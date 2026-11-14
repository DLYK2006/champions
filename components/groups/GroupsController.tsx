"use client";
// Connects Jay's CommunityScreen to real group data. Replaces <DemoCommunity /> on the Groups route once
// Jay agrees. Reads come from lib/groups (get_group_status via useGroupLive: realtime + polling); every
// membership change goes through the server RPCs and is followed by a refetch.
// Owner: @joshuatsou123 (pending board confirmation).
import { useState } from "react";
import { CommunityScreen } from "../ui/community-screen";
import { createGroup, joinGroup, leaveGroup, useGroupLive } from "../../lib/groups";

const MAX_NAME = 30; // groups.name check in 0002_groups.sql
const DEFAULT_BADGE = "leaf"; // matches the badge on Jay's demo garden

export default function GroupsController() {
  const { status, loading, error, refresh } = useGroupLive();
  const [notice, setNotice] = useState<string | null>(null);

  if (!status && loading) {
    return (
      <main>
        <p role="status">Finding your garden…</p>
      </main>
    );
  }
  if (!status && error) {
    return (
      <main>
        <p role="alert">{error}</p>
        <button type="button" onClick={() => void refresh()}>Try again</button>
      </main>
    );
  }

  return (
    <>
      {notice && <p role="alert">{notice}</p>}
      <CommunityScreen
        group={status?.group ?? null}
        progress={status?.progress ?? null}
        members={status?.members ?? []}
        onCreate={async (name) => {
          setNotice(null);
          const trimmed = name.trim();
          if (trimmed.length > MAX_NAME) throw new Error(`Group names can be up to ${MAX_NAME} characters.`);
          await createGroup(trimmed, DEFAULT_BADGE);
          await refresh();
        }}
        onJoin={async (code) => {
          setNotice(null);
          await joinGroup(code);
          await refresh();
        }}
        // CommunityScreen shows this button only while the user is in a group. Leaving is a real membership
        // change, so it is confirmed first; the invite code can bring the user back.
        onExploreSolo={() => {
          if (!window.confirm("Leave your group? You can rejoin later with its invite code.")) return;
          setNotice(null);
          leaveGroup()
            .then(() => refresh())
            .catch((e: unknown) => setNotice(e instanceof Error ? e.message : "Couldn't leave the group. Try again."));
        }}
      />
    </>
  );
}
