"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Group, GroupDailyProgress, GroupMemberStatus } from "@/types";
import { Garden } from "@/components/world/garden";
import { inviteCodeFromInput } from "@/lib/groups/invite";
import { Icon } from "./icons";
import { demoGroup, demoMembers } from "./demo-context";

export interface CommunityScreenProps {
  group: Group | null;
  progress: GroupDailyProgress | null;
  members: GroupMemberStatus[];
  onCreate: (name: string) => Promise<void>;
  onJoin: (code: string) => Promise<void>;
  onExploreSolo: () => void;
  onPreviewGroup?: () => void;
}
export function CommunityScreen({
  group,
  progress,
  members,
  onCreate,
  onJoin,
  onExploreSolo,
  onPreviewGroup,
}: CommunityScreenProps) {
  const [form, setForm] = useState<"create" | "join" | null>(null);
  const [value, setValue] = useState("");
  const [error, setError] = useState("");
  const [pending, setPending] = useState(false);
  const submitting = useRef(false);
  const [copied, setCopied] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    // A pasted invite link works as well as the bare code.
    const inviteCode = form === "join" ? inviteCodeFromInput(value) : null;
    if (form === "join" && !inviteCode) {
      setError("Enter a 6-character invite code or paste an invite link.");
      return;
    }
    if (
      form === "create" &&
      (value.trim().length < 2 || value.trim().length > 30)
    ) {
      setError("Choose a name between 2 and 30 characters.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      if (inviteCode) await onJoin(inviteCode);
      else await onCreate(value.trim());
      setForm(null);
      setValue("");
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "That didn’t work. Your details are still here; try again.",
      );
    } finally {
      submitting.current = false;
      setPending(false);
    }
  }
  async function copyCode() {
    if (!group) return;
    try {
      await navigator.clipboard.writeText(group.invite_code);
      setCopied(true);
    } catch {
      setError(`Your invite code is ${group.invite_code}.`);
    }
  }
  function openForm(mode: "create" | "join") {
    if (submitting.current) return;
    setForm(mode);
    setValue("");
    setError("");
  }
  return (
    <main className="community-page">
      <div className="screen-title-row">
        <h1 className="screen-title">Good things grow together.</h1>
        <button
          className="button button-soft"
          disabled={pending}
          onClick={group ? onExploreSolo : () => openForm("join")}
          aria-label={group ? "Leave group" : "Join a garden"}
        >
          {group ? "Leave group" : "Join"}
        </button>
      </div>
      {form ? (
        <section className="panel form-panel">
          <h2>{form === "join" ? "Join group" : "Create group"}</h2>
          <form onSubmit={submit} noValidate>
            <label className="field-label">
              {form === "join" ? "Invite code" : "Garden name"}
              <input
                className="text-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoFocus
                maxLength={form === "join" ? 200 : 30}
                placeholder={form === "join" ? "SPROUT" : "Group name"}
                aria-invalid={!!error}
                aria-describedby={error ? "group-error" : undefined}
                autoCapitalize={form === "join" ? "characters" : "words"}
                disabled={pending}
              />
            </label>
            {error && (
              <p className="field-error" id="group-error" role="alert">
                {error}
              </p>
            )}
            <div className="form-actions">
              <button
                type="button"
                className="button"
                disabled={pending}
                onClick={() => setForm(null)}
              >
                Cancel
              </button>
              <button className="button button-primary" disabled={pending}>
                {pending
                  ? "Saving…"
                  : form === "join"
                    ? "Join garden"
                    : "Create garden"}
              </button>
            </div>
          </form>
        </section>
      ) : (
        <>
          <Garden
            progress={group && progress ? progress.completion_percentage : 0}
            members={group ? members : []}
            name={group?.name || "Garden"}
          />
          {group && progress ? (
            <section
              className="panel group-progress-panel"
              aria-label="Group progress"
            >
              <div className="compact-group-summary">
                <span>
                  <strong>{progress.completion_percentage}%</strong> ·{" "}
                  {progress.completed_member_count}/
                  {progress.eligible_member_count} goals
                </span>
                <span className="bonus-mini">
                  <Icon name="coin" size={18} />
                  Up to +30
                </span>
                <button
                  className="code-pill"
                  onClick={copyCode}
                  aria-label="Copy group invite code"
                >
                  <b>{group.invite_code}</b>
                  <span>{copied ? "Copied" : "Invite"}</span>
                </button>
              </div>
              <div
                className="group-progress-track"
                role="progressbar"
                aria-label="Group goal completion"
                aria-valuenow={Math.max(
                  0,
                  Math.min(100, progress.completion_percentage),
                )}
                aria-valuemin={0}
                aria-valuemax={100}
              >
                <span
                  style={{
                    width: `${Math.max(0, Math.min(100, progress.completion_percentage))}%`,
                  }}
                />
              </div>
              <div
                className="compact-bonus-tiers"
                aria-label="Daily bonus tiers"
              >
                {[
                  { percent: 60, coins: 10 },
                  { percent: 80, coins: 20 },
                  { percent: 100, coins: 30 },
                ].map((tier) => (
                  <span
                    className={
                      progress.completion_percentage >= tier.percent
                        ? "reached"
                        : ""
                    }
                    key={tier.percent}
                  >
                    {tier.percent}% <Icon name="coin" size={13} />
                    {tier.coins}
                  </span>
                ))}
              </div>
              {error && (
                <p role="status" className="field-error">
                  {error}
                </p>
              )}
            </section>
          ) : (
            <div className="solo-actions">
              <button
                className="button button-primary"
                onClick={() => openForm("create")}
              >
                <Icon name="plus" size={18} />
                Create a group
              </button>
              <button className="button" onClick={() => openForm("join")}>
                <Icon name="users" size={18} />
                Join with a code
              </button>
              {onPreviewGroup && (
                <button className="text-button" onClick={onPreviewGroup}>
                  Preview group demo
                </button>
              )}
            </div>
          )}
        </>
      )}
    </main>
  );
}

const initialGroup: Group = {
  id: "demo-garden",
  name: "The Little Sprouts",
  badge: "leaf",
  invite_code: "SPROUT",
  creator_id: "demo-alex",
};
export function DemoCommunity() {
  const [group, setGroup] = useState<Group | null>(initialGroup);
  return (
    <CommunityScreen
      group={group}
      progress={group ? demoGroup : null}
      members={group ? demoMembers : []}
      onCreate={async (name) => setGroup({ ...initialGroup, name })}
      onJoin={async (code) => {
        if (code !== "SPROUT")
          throw new Error("This demo garden uses invite code SPROUT.");
        setGroup(initialGroup);
      }}
      onExploreSolo={() => setGroup(null)}
      onPreviewGroup={() => setGroup(initialGroup)}
    />
  );
}
