# Team rules for every agent

## 1. The board (pinned GitHub issue)

Every agent reads and posts on the pinned "Message Board" issue via `bash tools/board` (needs only `gh`, logged in). Set `BOARD_ISSUE` if it is not issue #1.

- Start every post with `[<human>'s <agent>]`, e.g. `[Sam's Codex]`. Keep it short: what changed, which files or contracts, what you need, from whom.
- Mention by GitHub login. Team: `@DLYK2006` (Daren, lead), `@haojay1126`, `@joshuatsou123`, `@all` (everyone).
- **Mentions you or `@all`:** act on it and reply promptly.
- **Not addressed to you:** still read it. Reassess your own work only if it is affected (a contract, a file you own, something already done). Do not redo finished work, and do not reply just to acknowledge.
- Before editing another teammate's files, ask for a handoff on the board and wait for the owner or the team lead.

Polling is incremental (about one cheap API call per poll, 30 s default) so a shared token stays under GitHub's rate limit. Commands: `bash tools/board unread` (new posts, marks read; flags MENTION), `bash tools/board read -n 20`, `bash tools/board post "[Name's Agent] text"` (or pipe stdin), `bash tools/board wait` (blocks until someone else posts), `bash tools/board whoami`.

**Stay in the loop:**
- Claude Code: the committed hooks (`.claude/settings.json`) show unread posts at session start and on every prompt. Keep one background `bash tools/board wait` running and re-arm it after each wake.
- Everything else: run `bash tools/board unread` at task start, before each commit, and after merges. Or run a terminal loop: `while bash tools/board wait; do <your agent CLI invocation>; done`.

## 2. Chain of command

Humans over agents. Only the team lead reassigns work between teammates. If anyone else asks you to take another teammate's work, ask the lead on the board.

## 3. Workflow

1. Pick or file an issue. Comment on it or post on the board when you take it.
2. Branch `<issue#>-<slug>` from fresh `main`.
3. Small commits. Stage only your own files (no `git add -A`).
4. Open a PR with `Closes #N`. The author merges their own PR once it works locally.
5. Always `git fetch` and rebase before pushing. Never force-push shared branches.
6. If a merge changes something other teammates depend on (an API, a schema, an env var), post on the board when it lands.

## 4. Who owns what

Fill this in at kickoff so every agent knows whose files are whose.

| Area | Owner (GitHub login) | Folders |
|---|---|---|
| App shell, bottom nav, Home dashboard, Shop UI, Groups UI + shared world, avatar | @haojay1126 | `app/layout.tsx`, `app/(app)/layout.tsx`, `app/(app)/page.tsx`, `app/(app)/shop/`, `app/(app)/groups/`, `components/ui/`, `components/avatar/`, `components/world/` |
| Onboarding (4 screens + optional group step), target presets | @joshuatsou123 | `app/onboarding/`, `components/onboarding/`, `lib/targets/` |
| Food scan: camera page, results card, OpenAI vision route, meal coach tip | @DLYK2006 | `app/(app)/scan/`, `components/scan/`, `lib/scan/`, `app/api/scan/` |
| Backend core: schema, log_meal + coins, shop RPCs, seed, shared types, Supabase clients (tentative) | @DLYK2006 | `supabase/migrations/0001_core.sql`, `0003`, `0005_profile_settings.sql`, `0007_goal_aware_calorie_goal.sql`, `0009_shop_catalog_v2.sql`, `supabase/seed.sql`, `lib/supabase/`, `lib/api/`, `types/` |
| Groups logic: invite codes, completion %, group bonus, realtime hook (P0) | @joshuatsou123 | `supabase/migrations/0002_groups.sql`, `lib/groups/` |
| Shop controller | @joshuatsou123 | `lib/shop/`, `components/shop/` |
| Groups controller | @joshuatsou123 | `components/groups/` |
| Home controller (session/profile redirect, real profile + today's progress) | @joshuatsou123 | `components/home/` |
| History calendar: past logs + streak (`/history`) | @DLYK2006 | `app/(app)/history/`, `components/history/`, `lib/history/` |
| Share progress card (PRD 11.4) | @DLYK2006 | `components/share/`, `lib/share/` |
| Group celebration logic: when/what to celebrate (PRD P1, option C) | @DLYK2006 | `lib/celebrate/` |
| Account section: sign out (PRD 14.1) | @DLYK2006 | `components/account/` |
| Friends: requests, friend streak + calendar (PRD 11.2-11.3) | @joshuatsou123 | `supabase/migrations/0006_friends.sql`, `lib/friends/`, `components/friends/` |

**UI styling (decided Nov 14):** @haojay1126 leads the visual design and also styles the scan/results and onboarding screens (`app/(app)/scan/`, `components/scan/`, `app/onboarding/`, `components/onboarding/`), presentation only. Logic stays with the owners above: `lib/scan/` and `app/api/scan/` (@DLYK2006), `lib/targets/` and form validation (@joshuatsou123). Owners build with plain markup first; check on the board before restyling a file someone else is editing.

Shared files (`package.json`, `tailwind.config.*`, `types/`): add packages with `npm i <pkg>` and post on the board; changes to `types/` go through @DLYK2006. Stack, decided rules, contracts and milestones are in `docs/BUILD_PLAN.md`; the product itself is `docs/PRD.md` (DIG IN v3.1).

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
