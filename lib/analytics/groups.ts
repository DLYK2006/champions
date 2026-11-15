// Databricks side of the group leaderboard: the group-day table, its upsert and the scoring query. Owner: @joshuatsou123
// Pure statement builders (no fetch, no env), so node --test can run them; the routes run them with runSql from
// ./databricks (3 s read timeout, Supabase fallback). Only group aggregates are stored: no names, no member data.
// The score mirrors group_scores() in supabase/migrations/0012_group_leaderboard.sql; keep the two in step.
import type { GroupDailyProgress } from "../../types/index";
import type { ScoreRow } from "../groups/leaderboard";

export const GROUP_TABLE = "workspace.digin.group_daily";
export const SCORES_TIMEOUT_MS = 3000;

export interface SqlParam { name: string; value: string | null }
export interface SqlQuery { statement: string; parameters: SqlParam[]; timeoutMs?: number }

export const CREATE_GROUP_TABLE = `
  CREATE TABLE IF NOT EXISTS ${GROUP_TABLE} (
    group_id STRING, date DATE, eligible INT, completed INT, completion_pct DOUBLE, bonus_tier INT
  )`;

// Unlike a meal, a group's day changes while members finish goals, so a matched row is updated, not skipped.
export const upsertGroupDayStatement = (d: GroupDailyProgress): SqlQuery => ({
  statement: `MERGE INTO ${GROUP_TABLE} t
     USING (SELECT :group_id AS group_id, CAST(:date AS DATE) AS date, CAST(:eligible AS INT) AS eligible,
                   CAST(:completed AS INT) AS completed, CAST(:completion_pct AS DOUBLE) AS completion_pct,
                   CAST(:bonus_tier AS INT) AS bonus_tier) s
     ON t.group_id = s.group_id AND t.date = s.date
     WHEN MATCHED THEN UPDATE SET *
     WHEN NOT MATCHED THEN INSERT *`,
  parameters: [
    { name: "group_id", value: d.group_id },
    { name: "date", value: d.date },
    { name: "eligible", value: String(d.eligible_member_count) },
    { name: "completed", value: String(d.completed_member_count) },
    { name: "completion_pct", value: String(d.completion_percentage) },
    { name: "bonus_tier", value: String(d.bonus_tier) },
  ],
});

// consistency_7d: average completion over the 7 days ending :today, starting no earlier than the group's first day
// with 2+ eligible members (so a missing day counts 0 only after that). full_bloom_streak: consecutive tier-30 days
// ending today, or yesterday if today is not a full bloom (yet). Rows: group_id, consistency_7d, full_bloom_streak.
// Hidden groups and groups with fewer than 2 members now are removed by the route, which only names visible groups.
export const groupScoresStatement = (today: string): SqlQuery => ({
  statement: `
    WITH firsts AS (
      SELECT group_id, MIN(date) AS first_day FROM ${GROUP_TABLE} WHERE eligible >= 2 GROUP BY group_id
    ),
    scored AS (
      SELECT group_id, GREATEST(first_day, DATE_SUB(CAST(:today AS DATE), 6)) AS start_day
      FROM firsts WHERE first_day <= CAST(:today AS DATE)
    ),
    averages AS (
      SELECT s.group_id,
             ROUND(COALESCE(SUM(t.completion_pct), 0) / (DATEDIFF(CAST(:today AS DATE), s.start_day) + 1), 1) AS consistency_7d
      FROM scored s
      LEFT JOIN ${GROUP_TABLE} t
        ON t.group_id = s.group_id AND t.date BETWEEN s.start_day AND CAST(:today AS DATE)
      GROUP BY s.group_id, s.start_day
    ),
    blooms AS (
      SELECT group_id, date FROM ${GROUP_TABLE} WHERE bonus_tier = 30 AND date <= CAST(:today AS DATE)
    ),
    anchors AS (
      SELECT s.group_id,
             CASE WHEN MAX(CASE WHEN b.date = CAST(:today AS DATE) THEN 1 ELSE 0 END) = 1 THEN CAST(:today AS DATE)
                  WHEN MAX(CASE WHEN b.date = DATE_SUB(CAST(:today AS DATE), 1) THEN 1 ELSE 0 END) = 1 THEN DATE_SUB(CAST(:today AS DATE), 1)
             END AS anchor
      FROM scored s LEFT JOIN blooms b ON b.group_id = s.group_id
      GROUP BY s.group_id
    ),
    numbered AS (
      SELECT b.group_id, b.date, a.anchor, ROW_NUMBER() OVER (PARTITION BY b.group_id ORDER BY b.date DESC) AS rn
      FROM blooms b JOIN anchors a ON a.group_id = b.group_id
      WHERE a.anchor IS NOT NULL AND b.date <= a.anchor
    ),
    streaks AS (
      SELECT group_id, COUNT(*) AS full_bloom_streak FROM numbered
      WHERE date = DATE_SUB(anchor, CAST(rn - 1 AS INT)) GROUP BY group_id
    )
    SELECT a.group_id, a.consistency_7d, COALESCE(k.full_bloom_streak, 0) AS full_bloom_streak
    FROM averages a LEFT JOIN streaks k ON k.group_id = a.group_id`,
  parameters: [{ name: "today", value: today }],
  timeoutMs: SCORES_TIMEOUT_MS,
});

export const toScoreRows = (rows: string[][]): ScoreRow[] =>
  rows.map(([group_id, score, streak]) => ({ group_id, consistency_7d: Number(score), full_bloom_streak: Number(streak) }));
