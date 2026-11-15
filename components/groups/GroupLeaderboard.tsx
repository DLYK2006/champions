"use client";
// The Leaderboard view for the Communities tab: groups ranked against each other on 7-day consistency, with a
// "full bloom" streak. Cooperative by design: groups only (never people), no calories or weight, nothing about who is
// behind, and any member can hide their group. Plain markup; Jay styles it. Owner: @joshuatsou123.
import { useCallback, useEffect, useState } from "react";
import { fetchLeaderboard, getLeaderboardVisible, setLeaderboardVisible, type LeaderboardResponse } from "../../lib/groups";

export default function GroupLeaderboard() {
  const [board, setBoard] = useState<LeaderboardResponse | null>(null);
  const [visible, setVisible] = useState<boolean | null>(null); // null: not in a group
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // A promise chain (like useFriends), so state is only set once the data arrives.
  const load = useCallback(
    () =>
      Promise.all([fetchLeaderboard(), getLeaderboardVisible()])
        .then(([next, shown]) => {
          setBoard(next);
          setVisible(shown);
          setError(null);
        })
        .catch((e: unknown) => setError(e instanceof Error ? e.message : "Couldn't load the leaderboard. Try again.")),
    [],
  );
  useEffect(() => { void load(); }, [load]);

  async function toggle(next: boolean) {
    if (saving) return;
    setSaving(true);
    try {
      await setLeaderboardVisible(next);
      await load();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Couldn't save that. Try again.");
    } finally {
      setSaving(false);
    }
  }

  if (!board && !error) return <p role="status">Gathering the gardens…</p>;
  if (!board) {
    return (
      <div>
        <p role="alert">{error}</p>
        <button type="button" className="button button-soft" onClick={() => void load()}>Try again</button>
      </div>
    );
  }

  return (
    <section className="panel" aria-label="Group leaderboard" style={{ padding: 18 }}>
      <h2>Gardens growing together</h2>
      <p><small>Groups ranked by how steadily everyone reached their goals over the last 7 days.</small></p>
      {error && <p role="alert" className="field-error">{error}</p>}
      {board.rows.length === 0 ? (
        <p>No gardens on the board yet. It fills in once groups of two or more have a few days of progress.</p>
      ) : (
        <ol aria-label="Groups" style={{ listStyle: "none", padding: 0, margin: "12px 0 0" }}>
          {board.rows.map((row) => (
            <li key={`${row.rank}-${row.group_name}`} aria-current={row.is_mine ? "true" : undefined}
              style={{ display: "flex", alignItems: "center", justifyContent: "space-between", gap: 12, padding: "10px 0", borderTop: "1px solid #e2dac6", fontWeight: row.is_mine ? 700 : 500 }}>
              <span style={{ overflowWrap: "anywhere" }}>
                <span aria-label={`Rank ${row.rank}`}>{row.rank}.</span> {row.group_name}{row.is_mine ? " (your group)" : ""}
              </span>
              <span style={{ textAlign: "right" }}>
                {Math.round(row.consistency_7d)}%
                {row.full_bloom_streak > 0 && <small> · {row.full_bloom_streak}-day full bloom</small>}
              </span>
            </li>
          ))}
        </ol>
      )}
      {visible !== null && (
        <label style={{ display: "flex", alignItems: "center", gap: 8, marginTop: 14 }}>
          <input type="checkbox" checked={visible} disabled={saving} onChange={(e) => void toggle(e.target.checked)} />
          Show my group on the leaderboard
        </label>
      )}
      {board.source === "databricks" && <p style={{ marginTop: 10 }}><small>Scored with Databricks</small></p>}
    </section>
  );
}
