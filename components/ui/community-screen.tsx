"use client";

import { useRef, useState, type FormEvent } from "react";
import type { Group, GroupDailyProgress, GroupMemberStatus } from "@/types";
import { Garden } from "@/components/world/garden";
import { PixelAvatar } from "@/components/avatar/pixel-avatar";
import { Icon } from "./icons";
import { PageIntro, SectionHeading } from "./primitives";
import { demoGroup, demoMembers } from "./demo-context";
import { AchievementDialog, type Achievement } from "./achievement";

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
  const [achievement, setAchievement] = useState<Achievement | null>(null);
  const [copied, setCopied] = useState(false);
  async function submit(event: FormEvent) {
    event.preventDefault();
    if (submitting.current) return;
    if (form === "join" && !/^[a-z0-9]{6}$/i.test(value.trim())) {
      setError("Enter a 6-character invite code.");
      return;
    }
    if (
      form === "create" &&
      (value.trim().length < 2 || value.trim().length > 40)
    ) {
      setError("Choose a name between 2 and 40 characters.");
      return;
    }
    submitting.current = true;
    setPending(true);
    setError("");
    try {
      if (form === "join") await onJoin(value.trim().toUpperCase());
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
    <main>
      <PageIntro
        eyebrow="A LITTLE COMPANY, A LITTLE EXTRA MAGIC"
        title="Good things grow together."
        description="Your goals are your own. The garden is something we share."
        trailing={
          <button
            className="button button-soft"
            disabled={pending}
            onClick={group ? onExploreSolo : () => openForm("join")}
          >
            <Icon name={group ? "leaf" : "users"} size={17} />
            {group ? "Explore solo" : "Join a garden"}
          </button>
        }
      />
      {form ? (
        <section className="panel form-panel">
          <h2>
            {form === "join"
              ? "Find your little crew."
              : "Plant something together."}
          </h2>
          <form onSubmit={submit} noValidate>
            <label className="field-label">
              {form === "join" ? "Invite code" : "Garden name"}
              <input
                className="text-input"
                value={value}
                onChange={(event) => setValue(event.target.value)}
                autoFocus
                maxLength={form === "join" ? 6 : 40}
                placeholder={
                  form === "join" ? "e.g. SPROUT" : "The Little Sprouts"
                }
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
            <p className="fine-print">
              A small space to cheer each other on. Your nutrition numbers stay
              private.
            </p>
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
                  ? "One moment…"
                  : form === "join"
                    ? "Join garden"
                    : "Create garden"}
              </button>
            </div>
          </form>
        </section>
      ) : group && progress ? (
        <div className="community-grid">
          <div className="community-main">
            <Garden
              progress={progress.completion_percentage}
              members={members}
              name={group.name}
            />
            <section className="panel group-progress-panel">
              <SectionHeading
                icon="leaf"
                aside={<span className="goal-badge">DAILY GARDEN QUEST</span>}
              >
                {group.name}
              </SectionHeading>
              <div className="group-progress-top">
                <div>
                  <strong>{progress.completion_percentage}%</strong>
                  <p>
                    {progress.completed_member_count} of{" "}
                    {progress.eligible_member_count} personal goals complete
                  </p>
                </div>
                <span className="bonus-mini">
                  <Icon name="coin" size={20} /> Up to +30 coins
                </span>
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
              <div className="bonus-tiers">
                {[
                  { percent: 60, coins: 10, name: "Little sprouts" },
                  { percent: 80, coins: 20, name: "Growing strong" },
                  { percent: 100, coins: 30, name: "Full bloom" },
                ].map((tier) => (
                  <div
                    className={`bonus-tier ${progress.completion_percentage >= tier.percent ? "reached" : ""}`}
                    key={tier.percent}
                  >
                    <span>{tier.percent}% together</span>
                    <b>
                      <Icon name="coin" size={16} />
                      {tier.coins} coins
                    </b>
                    <small>{tier.name}</small>
                  </div>
                ))}
              </div>
              <p className="fine-print">
                Bonus amounts are daily totals, up to 30 coins. Complete your
                own goals to qualify. Your personal rewards are always yours.
              </p>
              <div className="group-actions">
                <button
                  className="code-pill"
                  onClick={copyCode}
                  aria-label="Copy group invite code"
                >
                  <Icon name="users" size={15} />
                  INVITE <b>{group.invite_code}</b>
                  <span>{copied ? "Copied!" : "Copy"}</span>
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    setAchievement({
                      id: "group-preview",
                      title: "A whole garden of good.",
                      description:
                        "Everyone showed up in their own way. That’s something worth growing together.",
                      coins: 30,
                      group: true,
                      preview: true,
                    })
                  }
                >
                  Preview garden celebration <Icon name="spark" size={15} />
                </button>
              </div>
              {error && (
                <p role="status" className="fine-print">
                  {error}
                </p>
              )}
            </section>
          </div>
          <aside>
            <section className="panel members-panel">
              <SectionHeading
                icon="users"
                aside={
                  <span className="label-muted">
                    {members.length} GARDENERS
                  </span>
                }
              >
                Your little crew
              </SectionHeading>
              <p className="section-copy">
                Different goals. Growing side by side.
              </p>
              {members.map((member, i) => (
                <div className="member-row" key={member.user_id}>
                  <PixelAvatar
                    config={member.avatar}
                    equipped={member.equipped}
                    variant={i}
                    size={41}
                  />
                  <div>
                    <strong>{member.username}</strong>
                    <small>Fellow gardener</small>
                  </div>
                  <span
                    className={`member-status ${member.personal_goal_completed ? "" : "is-pending"}`}
                  >
                    <Icon
                      name={member.personal_goal_completed ? "check" : "leaf"}
                      size={14}
                    />
                    {member.personal_goal_completed
                      ? "Goal complete"
                      : "In progress"}
                  </span>
                </div>
              ))}
              <p className="members-note">
                Only completion is shared. Body stats and nutrition numbers stay
                in your own little corner.
              </p>
            </section>
            <div className="daily-note">
              <Icon name="leaf" />
              <p>
                Some days we bloom. Some days we rest.
                <br />
                <strong>There’s room for both here.</strong>
              </p>
            </div>
          </aside>
        </div>
      ) : (
        <div className="community-main">
          <Garden progress={0} name="Your future garden" />
          <section className="panel solo-panel">
            <SectionHeading icon="leaf">A little space to grow.</SectionHeading>
            <p>
              Invite a few friends to tend a garden together, or keep your
              adventure all your own. Personal quests, coins, and the shop are
              yours either way.
            </p>
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
            </div>
            {onPreviewGroup && (
              <button className="text-button" onClick={onPreviewGroup}>
                Preview group demo <Icon name="arrow" size={15} />
              </button>
            )}
          </section>
        </div>
      )}
      <footer className="page-footer">
        <span>
          <Icon name="leaf" size={14} /> COMPANY IS ALWAYS OPTIONAL
        </span>
        <span>Demo garden · no live group changes</span>
      </footer>
      <AchievementDialog
        achievement={achievement}
        onClose={() => setAchievement(null)}
      />
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
