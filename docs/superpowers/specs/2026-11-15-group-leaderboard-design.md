# Group leaderboard with Databricks (design, draft v2)

Author: Joshua's Claude for @joshuatsou123. Status: draft, not approved. Needs Daren (@DLYK2006) for the migration, the Databricks table and the new route. v2 replaces the scheduled-job version with Daren's live-query-with-fallback pattern from PR #87 (`lib/analytics/databricks.ts`, `app/api/analytics/route.ts`).

## Intent and why

Show groups how they are doing next to other groups, as a cooperative "we're doing well" signal, and have Databricks do the scoring so the feature fits the Databricks sponsor track. The PRD argues against competition between individuals (lines 57, 346, 353), so this ranks groups only, on consistency, never on calories, macros or weight.

## Goals

- A Leaderboard panel on the Community tab: top 10 groups plus the viewer's own group position.
- Scores computed by Databricks SQL from group aggregates.
- Always works: if Databricks is slow or down, a Supabase function gives the same ranking.

## Non-goals

- No individual leaderboard, no member names, no per-user data in the leaderboard path.
- No live (sub-minute) updates.
- No changes to the Profile analytics (macros chart) or the Calendar analysis slot.

## Anti-goals (failures even if it "works")

- Anyone feeling shamed: no bottom-of-list call-outs, no red states, no rank for a group that opted out.
- A group of 2 permanently losing to a group of 4 because of size alone.
- The Community tab erroring or hanging when Databricks is slow (Free Edition cold start is about 7 s).

## Constraints

- Privacy: only `group_id`, `date`, `completed_member_count`, `eligible_member_count`, `completion_percentage`, `bonus_tier` go to Databricks. Group names and the opt-out flag stay in Supabase.
- Groups with fewer than 2 eligible members are excluded (matches `group_tier`).
- Free Edition: one 2X-Small serverless warehouse, no scheduled jobs. Everything runs through the SQL Statement API from Next routes, as in PR #87. Env: `DATABRICKS_HOST`, `DATABRICKS_TOKEN`, `DATABRICKS_WAREHOUSE_ID`.
- Migration numbers: 0010 is Daren's `activity_level`; 0011 is `hide_status_from_group` (Joshua). This feature uses 0012.
- Ownership: backend, migration and the Databricks client are Daren's (approval needed); `lib/groups` and the panel controller are Joshua's; styling is Jay's.
- Next.js in this repo has breaking changes: read `node_modules/next/dist/docs/` before writing route or app code.

## Approaches considered

1. **Live query with Supabase fallback (chosen).** The route asks Databricks to compute scores with a 3 s timeout, else falls back to a Supabase function. Trade-off: two implementations of the score that must agree. Why: matches Daren's analytics pattern, works on the Free Edition, never breaks the screen.
2. **Scheduled Databricks job writing results back to Supabase.** Robust, but the Free Edition has no good way to host a schedule, and results go stale.
3. **No Databricks, Supabase only.** Simplest, but no sponsor-track value. Rejected. Its Supabase function is still built as the fallback in (1).

## Design

### Score

- `consistency_7d` = average `completion_percentage` over the last 7 days. A day with no row counts as 0 for any day the group had 2 or more eligible members.
- `full_bloom_streak` = current run of consecutive days (ending today or yesterday) with `bonus_tier = 30`.
- Rank by `consistency_7d` descending, then `full_bloom_streak` descending, then `group_id` (stable).
- Percentages, not counts, keep groups of different sizes comparable.

### Data flow

1. **Copy.** When a group's daily progress is evaluated (`evaluate_group`, after `log_meal`), a best-effort `POST /api/analytics/group` copies that day's row to `workspace.digin.group_daily` (`group_id`, `date`, counts, percentage, tier). Idempotent by `group_id` + `date` (`MERGE`), like the meal copy. Failure only means Databricks is behind.
2. **Serve.** `GET /api/leaderboard` (signed-in only):
   - Databricks path: SQL computes the scores and ranks over the last 7 days (3 s timeout), returning `group_id`, `consistency_7d`, `full_bloom_streak`, `rank`. The route then maps ids to names through `get_group_names(uuid[])`, which returns only visible groups.
   - Fallback path (timeout, error or empty): `get_group_leaderboard()` computes the same scores from `group_daily_progress` inside Supabase.
   - Response: `{ source: "databricks" | "supabase", rows: [{ rank, group_name, consistency_7d, full_bloom_streak, is_mine }] }`, top 10 plus the caller's own group if outside it. No ids are returned.
3. **Show.** A Leaderboard panel on the Community tab. If there are no rows, it is hidden.

### Schema (migration 0012)

- `groups.leaderboard_visible boolean not null default true`, with a way for a member to turn it off.
- `get_group_leaderboard()`: security definer, authenticated only, with the usual `revoke ... from public, anon` and `grant ... to authenticated`.
- `get_group_names(uuid[])`: security definer, returns names for visible groups only.

### Repo layout (proposed)

- `supabase/migrations/0012_group_leaderboard.sql`.
- `lib/analytics/` additions: `group_daily` table and MERGE, and the scoring SQL, next to Daren's Databricks client.
- `app/api/analytics/group/route.ts` and `app/api/leaderboard/route.ts`.
- `lib/groups/leaderboard.ts` (typed fetch wrapper, row types) with a node test.
- `components/groups/GroupLeaderboard.tsx` (plain markup, Jay styles it) with the opt-out toggle.

## Decided by the user

- Group leaderboard, not individual.
- Databricks is for the sponsor track.
- Daren has the Databricks credentials and workspace.
- Follow the live-query-with-fallback pattern (the user approved the revised approach).

## Calls I made (Joshua can change any)

- Score = 7-day average completion, tiebreak by full-bloom streak.
- Top 10 plus your own group, with no bottom-of-list highlighting.
- Visible by default with an opt-out (opt-in is the alternative).
- Hide the panel when there are no rows.
- Names come from Supabase via `get_group_names`, so group names never go to Databricks.

## Open for Daren

1. OK to add `groups.leaderboard_visible`, `get_group_leaderboard()` and `get_group_names()` in migration 0012?
2. OK to add `workspace.digin.group_daily` and the group-row copy (`/api/analytics/group`) next to the meal copy?
3. Where should the copy be triggered from: the client right after `log_meal` (as for meals), or inside the database after `evaluate_group`? I propose the client, so the database never calls out.
4. A backfill of existing `group_daily_progress` rows into Databricks, like the meal backfill script.

## Left to the builder

Exact SQL and table DDL, the visuals of the panel, and how the opt-out control is worded.
