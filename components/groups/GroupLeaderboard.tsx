"use client";
// The Leaderboard view for the Communities tab: groups ranked against each other on 7-day consistency, with a
// "full bloom" streak. Cooperative by design: groups only (never people), no calories or weight, nothing about who is
// behind, and any member can hide their group. Plain markup; Jay styles it. Owner: @joshuatsou123.
import { useCallback, useEffect, useState } from "react";
import { Icon } from "../ui/icons";
import "./leaderboard.css";
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

  if (!board && !error) return <section className="panel garden-league league-state" role="status"><Icon name="leaf" size={40} /><h2>Gathering the gardens...</h2></section>;
  if (!board) return <section className="panel garden-league league-state"><p role="alert">{error}</p><button type="button" className="button button-soft" onClick={() => void load()}>Try again</button></section>;

  return (
    <section className="panel garden-league" aria-label="Group leaderboard">
      <header className="league-header">
        <div className="league-emblem" aria-hidden="true"><Icon name="leaf" size={32} /></div>
        <div><span className="league-eyebrow">GROW TOGETHER</span><h2>Garden league</h2><p>7-day group consistency</p></div>
        <span className="league-season"><Icon name="calendar" size={16} /> Last 7 days</span>
      </header>
      {error && <p role="alert" className="field-error">{error}</p>}
      <div className="league-standings">
        {board.rows.length === 0 ? (
          <div className="league-state"><Icon name="leaf" size={42} /><h3>Room to grow</h3><p>Groups of two or more appear after a few days of progress.</p></div>
        ) : (
          <ol aria-label="Groups" className="league-list">
            {board.rows.map((row) => (
              <li key={`${row.rank}-${row.group_name}`} aria-current={row.is_mine ? "true" : undefined} className={`league-row${row.is_mine ? " league-mine" : ""}`}>
                <details>
                  <summary>
                    <span className={`league-medal league-rank-${Math.min(row.rank, 4)}`} aria-label={`Rank ${row.rank}`}>{row.rank}</span>
                    <span className="league-group"><strong>{row.group_name}</strong><span>{row.is_mine ? "Your garden" : "Group garden"}</span></span>
                    {row.full_bloom_streak > 0 && <span className="league-fire"><Icon name="flame" size={22} /><span>{row.full_bloom_streak}<span className="league-fire-label"> day bloom</span></span></span>}
                    <span className="league-score"><strong>{Math.round(row.consistency_7d)}<small>%</small></strong><span className="league-meter" aria-hidden="true"><span style={{ width: `${Math.max(0, Math.min(100, row.consistency_7d))}%` }} /></span></span>
                    <span className="league-expand" aria-hidden="true">+</span>
                  </summary>
                  <div className="league-detail"><span><Icon name="leaf" size={18} /> {Math.round(row.consistency_7d)}% consistency over the last 7 days</span><span><Icon name="flame" size={18} /> {row.full_bloom_streak > 0 ? `${row.full_bloom_streak} consecutive full-bloom ${row.full_bloom_streak === 1 ? "day" : "days"}` : "No full-bloom streak yet"}</span></div>
                </details>
              </li>
            ))}
          </ol>
        )}
      </div>
      <footer className="league-footer">
        {visible !== null && <label className="league-visibility"><input type="checkbox" checked={visible} disabled={saving} onChange={(e) => void toggle(e.target.checked)} /><span>Show my group on the leaderboard</span>{saving && <small role="status">Saving...</small>}</label>}
        <small>{board.source === "databricks" ? "Scored with Databricks" : "Gardens growing together"}</small>
      </footer>
    </section>
  );
}
