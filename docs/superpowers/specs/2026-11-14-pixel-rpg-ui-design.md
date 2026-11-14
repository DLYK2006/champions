# DIG IN approved frontend design

Approved by the human on November 14, 2026, after reviewing the screen layouts, visual system, and flow in chat. This document records that approval; it does not reassign teammates' files.

## Intent and scope

Make daily nutrition tracking feel like tending a cozy pixel-RPG world. Personal progress is complete without a group. Prioritize Home, AI Results, personal achievements, and Community. Implement presentation only, using the existing Next.js App Router, TypeScript, and Tailwind scaffold when its owner announces readiness.

No changes to Supabase, authentication, migrations, AI services, camera processing, server reward rules, or shared data contracts. No replacing teammates' implementations. Request and receive owner/lead handoffs before editing their files. The current scaffold wait on the board remains in effect.

## Approaches

The approved recommendation combines original pixel environments and characters with calm, readable app controls. Fully ornamented game controls were considered but would reduce nutrition/form readability. A conventional dashboard would lose the requested identity.

## Visual system

- Cream #FFF4DE; forest #284B36; sage #A8BD86; walnut #493323; gold #E9B64F; terracotta #BF7159.
- Short pixel headings; readable sans-serif body, forms, and tabular nutrition values.
- Parchment panels, stepped corners, restrained offset shadows, forest primary buttons.
- Original pixel room, garden, characters, items, food, and icons. Integer-scaled sprites; no emoji as production icons.
- 44px minimum touch targets, visible keyboard focus, accessible names and form errors, sufficient contrast, no color-only status.
- Small-screen-first layouts; centered desktop layout with two columns when space permits. Account for bottom navigation and safe areas.
- Gentle character breathing, blinking, plants, short coin trails. Respect prefers-reduced-motion with static illustrations and immediate values.

## Screens and flows

### Welcome and onboarding

Garden/cottage welcome with DIG IN and Start your adventure. Four steps: body stats and units; Bulk/Cut/Maintain with equal visual weight; editable nutrition targets and illustrative presets; character customization. Preserve the onboarding owner's validation, presets, state, and submission. Optional group invitation afterward.

### Home

Greeting/date, coin history trigger, streak; large cozy room and animated character; Today's Quest with calorie/protein bars and readable logged/target values; carbs/fat totals; personal achievements and rewards; optional compact group garden preview. Positive moods and neutral overages. At typical phone sizes show header, room, and beginning of nutrition content without scrolling.

### Scan and results

Presentational viewfinder with upload/capture controls wired to owner-provided handlers; scanning sweep; clear permission/upload/estimate errors and recovery. Results show image, meal type, estimated total nutrition, editable item cards/portions/nutrients, add/remove actions, per-item confidence, and approximation guidance. Sticky Confirm log above safe area. Preserve edits on failure; disable repeat submit while pending. Show success/rewards only from successful owner-provided results. No photo/AI processing in UI components.

### Community

Shared evolving garden, group progress, reward tiers, member avatars and completion statuses. No weights or exact nutrition. Garden stages: seedling, waking creature, developing clearing, vibrant garden, final bloom. No group: Create, Join with code, and Keep exploring solo. Private nutrition remains private. Existing tier contract: 60% = 10, 80% = 20, 100% = 30 total coins per qualifying member, not additive. No blame or ranking.

### Shop

Character preview; Hats/Outfits/Accessories; initial sunglasses 20, hoodie 40, crown 60. Preview before purchase. Distinct Buy, Buying, Owned, Equipped, insufficient-funds, and error states. Consume authoritative balance/inventory responses; no simulated backend behavior outside explicitly marked demo fixtures.

### Achievements

Personal success sheet: character, achievement, confirmed reward, Continue. Group bloom follows personal celebration rather than interrupting it. Dismissible; focus moves into dialog and returns to invoking control. Reduced motion keeps all information without moving effects. Do not replay rewards on rerender.

### Navigation

Home | Scan | Community | Shop, prominent Scan. Focused onboarding/capture can hide shell navigation using existing conventions. Scan -> estimate -> review/edit -> confirm -> optional personal celebration -> Home. Community is optional. Shop -> preview -> successful purchase -> equip.

## Integration and ownership

Live identity check: this session is authenticated as @haojay1126 (Jay). Shell/Home/Shop/Groups/avatar are Jay-owned, so no cross-owner handoff is required there. Daren must approve any onboarding or scan/results presentation handoff. The lead reiterated the scaffold wait on November 14; no scaffold files have been edited.

Use existing Profile, DailyProgress, ScanResult, LogMealResponse, GroupDailyProgress, GroupMemberStatus, and AvatarConfig contracts from docs/BUILD_PLAN.md. UI-only typed props and callbacks; local demo fixtures visibly identified. Do not add alternate authentication/data/service layers. Connect to owner-provided handlers/hooks after handoff. Do not redefine types/index.ts.

Pixel avatar rendering is approved as a visual direction, but the build plan specifies DiceBear. Coordinate its renderer with Jay/Daren before replacing anything; retain AvatarConfig and equipped item IDs. Reward completion is supplied by backend flags, not calculated from progress-bar width.

## Builder decisions

The implementer may choose component names, isolated style organization, artwork composition, and minor copy. Keep shared components small and use installed dependencies. Actual route wiring and file placement must follow the scaffold, not precede it. Initial artwork can live under public/dig-in/ without editing owned code. Do not imply live APIs in demo states.

## Verification

Use scaffold lint/type/build commands, interaction tests for meaningful state handling, keyboard/dialog checks, mobile/desktop screenshots, long values and empty/error states, reduced-motion checks, and integration boundary review. Report unavailable checks accurately. No production-readiness claims from mock-only verification.

A fresh builder reviewer checked the approved design and plan on November 14 and found no material unanswered design questions. Scaffold readiness and cross-owner handoffs remain external prerequisites.
