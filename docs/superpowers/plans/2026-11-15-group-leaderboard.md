# Group Leaderboard Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** A cooperative group-vs-group leaderboard on the Community tab, scored by Databricks with a Supabase fallback.

**Architecture:** Each group-day row is copied best-effort to Databricks after `log_meal` (like the meal copy). `GET /api/leaderboard` asks Databricks for 7-day scores (3 s timeout), else falls back to a Supabase function computing the same score; names always come from Supabase. A Leaderboard view joins the Group/Friends toggle.

**Tech Stack:** Next.js 16 (read `node_modules/next/dist/docs/` before route code), Supabase Postgres + RLS, Databricks SQL Statement API via `lib/analytics/databricks.ts`, node `--test`, PGlite for SQL tests.

**Spec:** `docs/superpowers/specs/2026-11-15-group-leaderboard-design.md` (approved by Daren on the board, 2026-11-15).

## Global Constraints

- Ranks groups only; never individuals; no calories, macros or weight; no bottom-of-list call-outs; groups of fewer than 2 eligible members are excluded.
- Only `group_id`, `date`, `completed_member_count`, `eligible_member_count`, `completion_percentage`, `bonus_tier` go to Databricks. Group names never do.
- Score = 7-day average `completion_percentage` (a day with no row counts 0 once the group has had 2+ eligible members), tiebreak = current run of `bonus_tier = 30` days ending today or yesterday, then `group_id`.
- Response `{ source: "databricks" | "supabase", rows: [{ rank, group_name, consistency_7d, full_bloom_streak, is_mine }] }`: top 10 plus the caller's own group if outside it; no ids returned.
- Databricks read timeout 3 s (reuse `runSql`); the copy is best-effort and never blocks or fails a meal.
- Migration `0012_group_leaderboard.sql`. Post on the board before pushing `0011` or `0012`; Daren applies them in order.
- Groups are visible by default; any member can toggle `groups.leaderboard_visible`.
- Dates are the client's local `YYYY-MM-DD` (`localDate()` in `lib/groups/api.ts`), passed through `clamp_today` in SQL.
- Team workflow: file an issue, branch `<issue#>-<slug>` from fresh `main`, stage only your own files, PR with `Closes #N`, `git fetch` + rebase before push.

## Review Focus

- A group with fewer than 2 eligible members (including one that dropped from 2 to 1) must not appear.
- A group whose last rows are older than 7 days appears with a 0 score, not an error.
- Equal scores and streaks rank in a stable order (by `group_id`), so the list does not reshuffle on refresh.
- A group that opted out is absent from everyone's list, including its own members' (their panel shows the toggle state instead).
- A second copy of the same group-day with changed counts must update the Databricks row (unlike meals, group rows change during the day).
- Databricks timeout, error or empty result falls back to Supabase and reports `source: "supabase"`; an empty fallback hides the panel.
- A caller with no group still sees the top 10 and no own row.

---

### Task 1: Migration 0012 and SQL tests

**Files:**
- Create: `supabase/migrations/0012_group_leaderboard.sql`
- Create: `supabase/tests/group_leaderboard.test.mjs` (same PGlite harness and Supabase stand-ins as `supabase/tests/groups.test.mjs`; applies 0001, 0002, 0003, 0012)

**Interfaces:**
- Produces (SQL, all `authenticated` only, `revoke ... from public, anon`):
  - `groups.leaderboard_visible boolean not null default true`
  - `get_group_leaderboard(p_today date default null) returns jsonb` → array of `{ rank, group_name, consistency_7d, full_bloom_streak, is_mine }`, top 10 plus own.
  - `get_group_names(p_ids uuid[]) returns jsonb` → `{ "<group_id>": "<name>" }` for visible groups only.
  - `set_group_leaderboard_visible(p_visible boolean) returns void` (caller must be in a group).
  - Internal `group_scores(p_today date)` (not granted): `group_id, consistency_7d numeric, full_bloom_streak int`, reused by `get_group_leaderboard`.

- [ ] **Step 1: File the issue and branch.** `gh issue create` "Group leaderboard (Databricks sponsor track)"; `git checkout -b <n>-group-leaderboard origin/main`.
- [ ] **Step 2: Write failing tests** in `group_leaderboard.test.mjs`, one `test()` each: `scores average completion over 7 days and count missing days as 0`; `streak counts consecutive tier-30 days ending today or yesterday`; `groups under 2 eligible members are excluded`; `ties rank by group_id`; `top 10 plus own group when outside the top 10`; `opted-out group is absent for everyone including its members`; `get_group_names returns only visible groups`; `set_group_leaderboard_visible needs a group and flips the flag`; `anon cannot call any of them`.
- [ ] **Step 3: Run** `npm i --no-save @electric-sql/pglite && node supabase/tests/group_leaderboard.test.mjs`. Expected: FAIL (functions missing).
- [ ] **Step 4: Implement** the migration with the signatures above. Window is the 7 days ending `clamp_today(p_today)`; a missing day counts 0 only on or after the group's first row with `eligible_member_count >= 2`.
- [ ] **Step 5: Run the test file again.** Expected: all pass. Also run `groups.test.mjs` and `log_meal.test.mjs` unchanged.
- [ ] **Step 6: Commit** `supabase/migrations/0012_group_leaderboard.sql` and the test.

### Task 2: Pure merge helper and client wrapper

**Files:**
- Create: `lib/groups/leaderboard.ts`
- Create: `lib/groups/leaderboard.test.mjs`
- Modify: `lib/groups/index.ts` (re-export)

**Interfaces:**
- Produces:
  - `type LeaderboardRow = { rank: number; group_name: string; consistency_7d: number; full_bloom_streak: number; is_mine: boolean }`
  - `type LeaderboardResponse = { source: "databricks" | "supabase"; rows: LeaderboardRow[] }`
  - `type ScoreRow = { group_id: string; consistency_7d: number; full_bloom_streak: number }`
  - `buildLeaderboard(scores: ScoreRow[], names: Record<string, string>, myGroupId: string | null, limit = 10): LeaderboardRow[]` (pure: drops groups with no name entry, i.e. hidden; sorts by score, streak, group_id; ranks from the full list; returns top `limit` plus the caller's row if outside it).
  - `fetchLeaderboard(): Promise<LeaderboardResponse>` (GET `/api/leaderboard` with the session bearer token; friendly errors like `lib/groups/api.ts`).
  - `setLeaderboardVisible(visible: boolean): Promise<void>` (RPC wrapper).

- [ ] **Step 1: Write failing tests** `buildLeaderboard sorts by score then streak then id`, `returns top 10 plus own row outside the top 10 with its true rank`, `drops groups missing from names (hidden)`, `no group: top 10, is_mine all false`, `empty scores give empty rows`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test lib/groups/leaderboard.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement** the helper and wrappers.
- [ ] **Step 4: Run tests.** Expected: pass.
- [ ] **Step 5: Commit.**

### Task 3: Databricks group table and scoring SQL

**Files:**
- Create: `lib/analytics/groups.ts`
- Create: `lib/analytics/groups.test.mjs`

**Interfaces:**
- Consumes: `runSql(statement, parameters, timeoutMs)` and the `Param` shape from `lib/analytics/databricks.ts`.
- Produces:
  - `GROUP_TABLE = "workspace.digin.group_daily"`, `CREATE_GROUP_TABLE` (columns `group_id STRING, date DATE, eligible INT, completed INT, completion_pct DOUBLE, bonus_tier INT`).
  - `upsertGroupDay(row: GroupDayRow): Promise<unknown>` using `MERGE ... ON t.group_id = s.group_id AND t.date = s.date WHEN MATCHED THEN UPDATE SET * WHEN NOT MATCHED THEN INSERT *`.
  - `queryGroupScores(today: string, timeoutMs = 3000): Promise<ScoreRow[]>` computing the Global Constraints score in SQL.
  - `type GroupDayRow = GroupDailyProgress` from `types/index.ts`.

- [ ] **Step 1: Write failing tests** `upsertGroupDay sends a MERGE keyed on group_id and date that updates matched rows` and `queryGroupScores binds today and a 3000 ms timeout` (stub `globalThis.fetch`, assert the request body's `statement` and `parameters`); `queryGroupScores maps data_array rows to ScoreRow numbers`.
- [ ] **Step 2: Run** `node --experimental-strip-types --test lib/analytics/groups.test.mjs`. Expected: FAIL.
- [ ] **Step 3: Implement.** The scoring SQL mirrors the Task 1 window and streak rules; keep it one statement.
- [ ] **Step 4: Run tests.** Expected: pass.
- [ ] **Step 5: Commit.**

### Task 4: API routes

**Files:**
- Create: `app/api/analytics/group/route.ts`
- Create: `app/api/leaderboard/route.ts`

**Interfaces:**
- Consumes: `upsertGroupDay`, `queryGroupScores` (Task 3); `buildLeaderboard`, `ScoreRow` (Task 2); RPCs `my_group_id`, `get_group_names`, `get_group_leaderboard` (Task 1). Follow the auth/Supabase-client pattern in `app/api/analytics/route.ts` and `app/api/analytics/meal/route.ts`.
- Produces: `POST /api/analytics/group { date }` → 204 (404 no row, 400 bad date, 401 signed out, 502 Databricks failed). `GET /api/leaderboard` → `LeaderboardResponse`.

- [ ] **Step 1: Read** the Next.js route-handler docs in `node_modules/next/dist/docs/` and the two existing analytics routes.
- [ ] **Step 2: Implement `POST /api/analytics/group`**: read the caller's own row from `group_daily_progress` for `date` (RLS limits it to their group), `upsertGroupDay`, 204. The route never trusts client-supplied counts.
- [ ] **Step 3: Implement `GET /api/leaderboard`**: try `queryGroupScores(today)` then `get_group_names` and `buildLeaderboard`; on timeout, error or an empty result, call `get_group_leaderboard` and set `source: "supabase"`.
- [ ] **Step 4: Typecheck and lint** `npx tsc --noEmit` (ignore stale `.next/dev/types`), `npx eslint app/api`. Expected: clean.
- [ ] **Step 5: Smoke test locally** with `npx next dev --webpack` and two accounts (see Task 7); first with Databricks env unset (expect `source: "supabase"`).
- [ ] **Step 6: Commit.**

### Task 5: Client copy trigger and backfill

**Files:**
- Modify: `components/scan/scan-controller.tsx` (next to the existing `/api/analytics/meal` call, ~line 79; handoff approved by Daren)
- Create: `scripts/databricks-group-sync.mjs`

**Interfaces:**
- Consumes: `LogMealResponse.group` (null when solo), `localDate()`, `CREATE_GROUP_TABLE`, `upsertGroupDay`.
- Produces: after `log_meal`, when `r.group` is non-null, a fire-and-forget `fetch("/api/analytics/group", { method: "POST", keepalive: true, body: { date: r.group.date } })`; failures only `console.warn`. The script creates the table and copies all `group_daily_progress` rows (500 per page, like `scripts/databricks-sync.mjs`).

- [ ] **Step 1: Add the call** mirroring the meal copy; solo users send nothing.
- [ ] **Step 2: Write the script**; run `node --experimental-strip-types --env-file=.env.local scripts/databricks-group-sync.mjs` (Daren's credentials). Expected: prints rows sent and row count.
- [ ] **Step 3: Typecheck and lint** both files. Expected: clean.
- [ ] **Step 4: Commit.**

### Task 6: Leaderboard view and opt-out

**Files:**
- Create: `components/groups/GroupLeaderboard.tsx`
- Modify: `components/groups/GroupsController.tsx` (third segmented button "Leaderboard" in `CommunitiesView`, its content scrolling like the Friends view)

**Interfaces:**
- Consumes: `fetchLeaderboard`, `setLeaderboardVisible`, `LeaderboardRow` (Task 2).
- Produces: `GroupLeaderboard()` default export; plain markup in the existing class names, no inline styles beyond layout (Jay restyles). Shows rank, group name (mine marked), score as a percentage and the streak as "N-day full bloom"; hides itself when `rows` is empty; the opt-out checkbox "Show my group on the leaderboard"; loading and error states in `role="status"` and `role="alert"`.

- [ ] **Step 1: Implement** the component and the toggle button; keep every string cozy (no "last place", no red).
- [ ] **Step 2: Typecheck and lint.** Expected: clean.
- [ ] **Step 3: Manual check** in the running app (Task 7 script).
- [ ] **Step 4: Commit.**

### Task 7: Verify, PR and board

- [ ] **Step 1:** Run all tests: `node --test lib/groups/leaderboard.test.mjs lib/analytics/groups.test.mjs lib/groups/invite.test.mjs`, `node supabase/tests/group_leaderboard.test.mjs`, `node supabase/tests/groups.test.mjs`. Expected: all pass.
- [ ] **Step 2: Two-account check** (`npx next dev --webpack`, two browsers): both in one group, log meals, open Leaderboard; toggle opt-out and see the group vanish for both; confirm `source` in the network response with and without Databricks env.
- [ ] **Step 3: Databricks check** with Daren's env: run the backfill script, confirm `source: "databricks"` and that scores match the fallback for the same data.
- [ ] **Step 4:** Post on the board before pushing the migration; `git fetch`, rebase, push, open the PR with `Closes #N`; Daren applies `0012`; post when merged and tell Jay the panel is ready to restyle.

---

## Self-review

- **Spec coverage:** score, opt-out, fallback, privacy, migration, copy trigger, backfill, panel and toggle each map to a task above. Daren's four answers are in Tasks 1, 3, 5 and the Global Constraints.
- **Types:** `ScoreRow`, `LeaderboardRow`, `LeaderboardResponse` are defined in Task 2 and used in Tasks 3, 4 and 6; `GroupDayRow` is the existing `GroupDailyProgress`.
- **Calls I made beyond the spec** (flag for review): any member can toggle visibility; own group hidden from its own members' list when opted out; the Leaderboard sits behind a third toggle button because the Group view cannot scroll.
