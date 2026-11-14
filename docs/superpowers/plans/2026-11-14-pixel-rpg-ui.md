# DIG IN Pixel RPG Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [x]`) syntax for tracking.

**Goal:** Implement the approved cozy pixel-RPG presentation without replacing teammates' functionality.

**Architecture:** Reusable typed presentation components consume the existing domain types and owner-provided callbacks. Original static pixel artwork sits in public/dig-in; animation and responsive behavior remain in the presentation layer. Follow the scaffold once available rather than creating a competing app.

**Tech Stack:** Existing Next.js App Router, TypeScript, Tailwind; installed dependencies only unless explicitly coordinated.

**Spec:** docs/superpowers/specs/2026-11-14-pixel-rpg-ui-design.md

## Global Constraints

- No changes to Supabase, authentication, migrations, AI services, camera processing, server reward rules, or shared data contracts.
- No replacing teammates' implementations. Request and receive owner/lead handoffs before editing their files.
- The current scaffold wait on the board remains in effect.
- 44px minimum touch targets, visible keyboard focus, accessible names and form errors, sufficient contrast, no color-only status.
- Respect prefers-reduced-motion with static illustrations and immediate values.
- Existing tier contract: 60% = 10, 80% = 20, 100% = 30 total coins per qualifying member, not additive.

## Review Focus

1. Unavailable scaffold or ungranted handoff: no competing implementation or edits to owned files.
2. Slow/rejected confirm or purchase: edits preserved, no double submit, no false reward/balance changes.
3. Empty data, long names, large nutrition values: meaningful fallback and no horizontal overflow.
4. Keyboard and reduced-motion users: usable navigation/dialog focus, no required animation.
5. Group privacy and solo use: no exact member nutrition, no group requirement for core actions.

## Task 1: Ownership, scaffold, and original art

**Files:** new public/dig-in/room.png, public/dig-in/garden.png, docs/superpowers/specs/2026-11-14-pixel-rpg-ui-design.md. Existing app/package files are inspection-only until handoff.

**Interfaces:** consumes approved design and owner announcements; produces original scene assets and a verified frontend integration map.

- [x] Read current repo, PRD, build plan, board, and ownership.
- [x] Post presentation-only handoff request and ask for scaffold status (#6).
- [x] Generate and inspect original room and garden scenes, with no text baked into artwork; persist selected outputs and prompts.
- [x] Receive scaffold-ready announcement before coding. Lead cleared assigned folders on the board at 21:24 UTC. Jay-owned areas need no handoff; cross-owner edits remain pending Daren's approval.
- [x] Fetch fresh main, rebase issue branch, inspect package scripts, components, shared types, and call sites. Scaffold matches planned app/component paths. Add scoped components/ui/dig-in.css via the owned root layout, components/ui/app-shell.tsx, components/ui/demo-context.tsx, components/ui/home-screen.tsx, components/ui/achievement.tsx, components/avatar/pixel-avatar.tsx and components/world/garden.tsx. No app/globals.css edits required.
- [x] Run baseline checks provided by scaffold; lint passed. tsc before Next type generation reports missing LayoutProps in scaffold layouts; recheck after Next generation. Browser check uses temporary external Playwright installation, without changing app dependencies.
- [x] Commit only new design/art files, after board unread.

## Task 2: Home, reusable presentation, navigation, and achievements

**Files after handoff:** components/ui/, components/avatar/, app/(app)/layout.tsx, app/(app)/page.tsx; presentation styles in scaffold's existing stylesheet convention. Avoid backend imports beyond existing owner wiring.

**Interfaces:** consume Profile, DailyProgress, CoinEvent, GroupDailyProgress and owner handlers; produce reusable panel/button/nutrition/scene/dialog components and Home composition. Keep AvatarConfig compatible.

- [x] Check existing fixtures/tests; add meaningful interaction assertions for successful vs rejected actions, dialog dismiss/focus restoration, and repeated reward identity where these behaviors are implemented here.
- [x] Implement shared visuals and Home, preserving existing data hooks; use clearly marked demo fixtures only if owner APIs are unavailable.
- [x] Add four-tab navigation, responsive layouts, reduced-motion styles, and accessible achievement presentation.
- [x] Verify 360px phone, larger phone, desktop, long values, zero targets, empty data, keyboard focus and reduced motion.
- [x] Run scaffold checks and focused interactions; commit only owned/handoff files.

## Task 3: Scan and results presentation

**Files after handoff:** components/scan/ and UI-only portions of app/(app)/scan/. Never app/api/scan/, lib/scan/, or camera processing.

**Interfaces:** consume ScanResult and owner-provided capture, upload, edit, retry and confirm handlers. Owner's successful LogMealResponse drives reward presentation.

- [x] Pin pending submit and rejected-save behavior with existing test tools: no repeat handler invocation while pending, edits survive error, failed responses show no rewards.
- [x] Style capture, scanning, empty/error and editable result states; implement readable confidence and estimation guidance.
- [x] Verify sticky confirmation and keyboard don't obscure food fields on mobile; verify camera/AI logic diff is empty.
- [x] Run relevant checks and commit.

## Task 4: Community and shop presentation

**Files after handoff:** app/(app)/groups/, app/(app)/shop/, components/world/ and agreed UI helpers.

**Interfaces:** consume Group, GroupDailyProgress, GroupMemberStatus and existing group/shop hooks. Callback results drive authoritative purchase/equip states.

- [x] Test solo/empty group and pending/rejected purchase states with existing tools where logic lives in presentation.
- [x] Build evolving garden, member status cards, correct bonus-tier labels and create/join presentation without exposing exact member intake.
- [x] Build item preview/inventory and explicit buy/equip/error states using existing item IDs/prices.
- [x] Verify group routes don't gate Home/Scan/Shop and no client code awards coins.
- [x] Run relevant checks and commit.

## Task 5: Onboarding presentation and complete verification

**Files after handoff:** components/onboarding/ and UI-only parts of app/onboarding/. Do not edit lib/targets/ or owner submission/validation logic.

**Interfaces:** existing onboarding state, validation, avatar config and callbacks; produces approved visual treatment without changing input rules.

- [x] Apply the visual system to welcome, body stats, goals, targets and avatar steps; preserve optional group skip.
- [x] Verify existing validation messages, units, back navigation, submission and focus remain intact.
- [x] Run lint/type/build and meaningful tests once; inspect screenshots at phone and desktop sizes, keyboard flow, reduced motion, all priority states.
- [x] Review final diff for ownership and technical boundaries; document live vs mock integrations and unavailable verification.
- [ ] Board unread; fetch and rebase; push issue branch; open PR with Closes #6. Merge only if checks and team handoffs are satisfied; post landed UI contract effects.

## Current status

Design approved and implemented inline. Scaffold and cross-owner styling handoffs received; onboarding logic merged before restyling. All five routes and the scanner result/achievement states are implemented. Typed demo wrappers remain explicit; domain contracts are unchanged. Lint, generated route types, TypeScript, production build, 10 target tests, browser interactions, rejected async-action regression, and automated accessibility checks passed. Final publishing/merge remains pending below.

## Final review and rulings

- Fresh reviewer found one material issue: pending group requests could switch form and lose retry details. Regression failed before the guard, then passed after disabling the header transition and guarding openForm. Rejected result/shop callbacks are also covered.
- Corrected the first-member identity assumption and empty-day ready mood; added configurable full-body avatar support for profile appearances.
- Ruling: use the existing issue branch in the shared checkout, preserving teammates through owned-file edits and approved presentation handoffs; no second scaffold or backend changes.
- Ruling: retain demo wrappers until owner controllers wire authoritative data. Live camera/AI/auth/save/realtime integration is not claimed by frontend-only checks.
- Ruling: keep Playwright/axe outside the app dependency manifest; documented reproducible browser commands in docs/FRONTEND_HANDOFF.md.
- No deferred review findings.
