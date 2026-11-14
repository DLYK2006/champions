# DIG IN Pixel RPG Frontend Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

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
- [ ] Generate and inspect original room and garden scenes, with no text baked into artwork; persist selected outputs and prompts.
- [ ] Receive scaffold-ready announcement before coding. Jay-owned areas need no handoff; receive Daren's approval before editing onboarding or scan/results presentation.
- [ ] Fetch fresh main, rebase issue branch, inspect package scripts, components, shared types, and call sites. Resolve exact component paths against scaffold and update this plan before edits.
- [ ] Run baseline checks provided by scaffold; distinguish existing failures.
- [ ] Commit only new design/art files, after board unread.

## Task 2: Home, reusable presentation, navigation, and achievements

**Files after handoff:** components/ui/, components/avatar/, app/(app)/layout.tsx, app/(app)/page.tsx; presentation styles in scaffold's existing stylesheet convention. Avoid backend imports beyond existing owner wiring.

**Interfaces:** consume Profile, DailyProgress, CoinEvent, GroupDailyProgress and owner handlers; produce reusable panel/button/nutrition/scene/dialog components and Home composition. Keep AvatarConfig compatible.

- [ ] Check existing fixtures/tests; add meaningful interaction assertions for successful vs rejected actions, dialog dismiss/focus restoration, and repeated reward identity where these behaviors are implemented here.
- [ ] Implement shared visuals and Home, preserving existing data hooks; use clearly marked demo fixtures only if owner APIs are unavailable.
- [ ] Add four-tab navigation, responsive layouts, reduced-motion styles, and accessible achievement presentation.
- [ ] Verify 360px phone, larger phone, desktop, long values, zero targets, empty data, keyboard focus and reduced motion.
- [ ] Run scaffold checks and focused interactions; commit only owned/handoff files.

## Task 3: Scan and results presentation

**Files after handoff:** components/scan/ and UI-only portions of app/(app)/scan/. Never app/api/scan/, lib/scan/, or camera processing.

**Interfaces:** consume ScanResult and owner-provided capture, upload, edit, retry and confirm handlers. Owner's successful LogMealResponse drives reward presentation.

- [ ] Pin pending submit and rejected-save behavior with existing test tools: no repeat handler invocation while pending, edits survive error, failed responses show no rewards.
- [ ] Style capture, scanning, empty/error and editable result states; implement readable confidence and estimation guidance.
- [ ] Verify sticky confirmation and keyboard don't obscure food fields on mobile; verify camera/AI logic diff is empty.
- [ ] Run relevant checks and commit.

## Task 4: Community and shop presentation

**Files after handoff:** app/(app)/groups/, app/(app)/shop/, components/world/ and agreed UI helpers.

**Interfaces:** consume Group, GroupDailyProgress, GroupMemberStatus and existing group/shop hooks. Callback results drive authoritative purchase/equip states.

- [ ] Test solo/empty group and pending/rejected purchase states with existing tools where logic lives in presentation.
- [ ] Build evolving garden, member status cards, correct bonus-tier labels and create/join presentation without exposing exact member intake.
- [ ] Build item preview/inventory and explicit buy/equip/error states using existing item IDs/prices.
- [ ] Verify group routes don't gate Home/Scan/Shop and no client code awards coins.
- [ ] Run relevant checks and commit.

## Task 5: Onboarding presentation and complete verification

**Files after handoff:** components/onboarding/ and UI-only parts of app/onboarding/. Do not edit lib/targets/ or owner submission/validation logic.

**Interfaces:** existing onboarding state, validation, avatar config and callbacks; produces approved visual treatment without changing input rules.

- [ ] Apply the visual system to welcome, body stats, goals, targets and avatar steps; preserve optional group skip.
- [ ] Verify existing validation messages, units, back navigation, submission and focus remain intact.
- [ ] Run lint/type/build and meaningful tests once; inspect screenshots at phone and desktop sizes, keyboard flow, reduced motion, all priority states.
- [ ] Review final diff for ownership and technical boundaries; document live vs mock integrations and unavailable verification.
- [ ] Board unread; fetch and rebase; push issue branch; open PR with Closes #6. Merge only if checks and team handoffs are satisfied; post landed UI contract effects.

## Current status

Design approved. Implementation is waiting on the team's scaffold announcement and presentation ownership handoffs. Plan paths reflect the committed build plan and must be reconciled with the actual scaffold before coding. Execution proceeds inline; no extra human approval is needed for the already approved design.
