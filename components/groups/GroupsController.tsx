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
      <GroupsView />
    </RequireProfile>
  );
}

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
      {notice && <p role="alert">{notice}</p>}
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
        <p style={{ padding: "0 16px 112px", textAlign: "center" }}>
          <button type="button" onClick={() => void copyLink()}>
            {linkCopied ? "Invite link copied" : "Copy invite link"}
          </button>
        </p>
      )}
    </>
  );
}
