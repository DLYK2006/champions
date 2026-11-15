"use client";
// Connects Jay's CommunityScreen to real group data. Reads come from lib/groups (get_group_status via
// useGroupLive: realtime + polling); every membership change goes through the server RPCs and is followed by
// a refetch. Also owns the shareable invite link (PRD 8.2), shown while the user is in a group. New groups get
// the default badge (a badge picker here was removed: it broke the Groups page layout).
// Owner: @joshuatsou123.
import { useEffect, useRef, useState } from "react";
import { CommunityScreen } from "../ui/community-screen";
import {
  DEFAULT_BADGE, codeFromSearch, inviteLink, savePendingCode,
  createGroup, joinGroup, leaveGroup, useGroupLive,
} from "../../lib/groups";
import { RequireProfile } from "../auth";
import { FriendsView } from "../friends";
import GroupLeaderboard from "./GroupLeaderboard";

const MAX_NAME = 30; // groups.name check in 0002_groups.sql

// Signed-out or not-yet-onboarded visitors are sent to /onboarding before any group data is requested
// (the group functions are not callable without a session). An invite link's code is remembered first so the
// onboarding group step can use it.
export default function GroupsController() {
  useEffect(() => {
    const code = codeFromSearch(window.location.search);
    if (code) savePendingCode(code);
  }, []);
  return (
    <RequireProfile>
      <CommunitiesView />
    </RequireProfile>
  );
}

// PRD 11.1: the Communities tab switches between the Group, Friends and Leaderboard views.
// Uses the app's existing segmented-control style (.shop-tabs) so it matches the Shop filters.
// Layout: on phones this route is a fixed-height, non-scrolling screen (compact.css). The toggle takes its own
// small row and the view below gets the rest, so the garden shrinks instead of the progress panel being pushed
// off the bottom. The Friends view scrolls inside that space.
function CommunitiesView() {
  const [view, setView] = useState<"group" | "friends" | "leaderboard">("group");
  return (
    <div style={{ height: "100%", minHeight: 0, display: "flex", flexDirection: "column", gap: 8 }}>
      <div className="shop-tabs" role="group" aria-label="Communities view" style={{ margin: 0, padding: 3, flexShrink: 0 }}>
        <button type="button" style={TOGGLE_BUTTON} aria-pressed={view === "group"} onClick={() => setView("group")}>Group</button>
        <button type="button" style={TOGGLE_BUTTON} aria-pressed={view === "friends"} onClick={() => setView("friends")}>Friends</button>
        <button type="button" style={TOGGLE_BUTTON} aria-pressed={view === "leaderboard"} onClick={() => setView("leaderboard")}>Leaderboard</button>
      </div>
      <div style={{ flex: 1, minHeight: 0, display: "flex", flexDirection: "column", overflowY: view === "group" ? "hidden" : "auto" }}>
        {view === "group" ? <GroupsView /> : view === "friends" ? <FriendsView /> : <GroupLeaderboard />}
      </div>
    </div>
  );
}
const TOGGLE_BUTTON = { minHeight: 36 } as const;

function GroupsView() {
  const { status, loading, error, refresh } = useGroupLive();
  const [notice, setNotice] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);
  const inviteHandled = useRef(false);

  // /groups?code=ABC123 -> offer to join once the page knows whether the user already has a group.
  useEffect(() => {
    if (inviteHandled.current || loading || (!status && error)) return;
    const code = codeFromSearch(window.location.search);
    if (!code) return;
    inviteHandled.current = true;
    window.history.replaceState(null, "", window.location.pathname);
    void (async () => {
      if (status?.group) {
        setNotice("You're already in a group. Leave it first to join another.");
        return;
      }
      if (!window.confirm(`Join the group with invite code ${code}?`)) return;
      try {
        await joinGroup(code);
        await refresh();
      } catch (e) {
        setNotice(e instanceof Error ? e.message : "Couldn't join that group. Try again.");
      }
    })();
  }, [loading, status, error, refresh]);

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

  const group = status?.group ?? null;
  async function copyLink() {
    if (!group) return;
    const link = inviteLink(window.location.origin, group.invite_code);
    try {
      await navigator.clipboard.writeText(link);
      setLinkCopied(true);
    } catch {
      setNotice(`Share this link: ${link}`);
    }
  }

  return (
    <>
      {notice && <p role="alert" style={{ margin: 0, flexShrink: 0 }}>{notice}</p>}
      <CommunityScreen
        group={group}
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
          setLinkCopied(false);
          leaveGroup()
            .then(() => refresh())
            .catch((e: unknown) => setNotice(e instanceof Error ? e.message : "Couldn't leave the group. Try again."));
        }}
      />
      {group && (
        // Kept to one short row: this screen does not scroll, so anything tall here would hide the progress panel.
        <p style={{ margin: "6px 0 0", textAlign: "center", flexShrink: 0 }}>
          <button type="button" className="text-button" onClick={() => void copyLink()}>
            {linkCopied ? "Invite link copied" : "Copy invite link"}
          </button>
        </p>
      )}
    </>
  );
}
