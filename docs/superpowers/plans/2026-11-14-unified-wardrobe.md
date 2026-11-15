# Unified wardrobe implementation plan

> Execute inline with superpowers:executing-plans. Request one fresh whole-branch review before integration.

**Goal:** Consistent original sprite avatars, stable rear hair, eight polished starter wearables and persistent customization.

**Architecture:** Shared Canvas sprite preparation/preview, small typed wardrobe catalog, controlled selection UI, existing avatar JSON and owner persistence contracts.

**Tech Stack:** Existing Next.js/React/TypeScript, Canvas 2D, external Playwright and node:test; no app dependencies.

**Spec:** docs/superpowers/specs/2026-11-14-unified-wardrobe.md

## Constraints and review focus

- Never modify owner auth, AI, camera, persistence controllers or shared types without handoff. Request optional appearance fields and save callback on board.
- Keep legacy profile options readable; replace the old portrait renderer entirely, preserving accessible name/size contracts.
- Head, hats and outfit masks align across 24 atlas cells; no alpha holes, detached hair or face/backpack paint bleed.
- New selections preview instantly, survive server round trip and do not spend coins. Existing paid equipment wins while worn.
- Pending save cannot overwrite newer edits, failures retain draft; reset restores saved avatar. Motion and hidden-tab cleanup remain intact.

## Tasks

- [ ] Reproduce rear short-hair defect and old onboarding renderer in browser; add failing appearance/wardrobe regression and visual contact sheet.
- [ ] Implement stable registered heads and eight direction-safe wardrobe options in shared sprite preparation; inspect all directions/frames and combinations.
- [ ] Replace SVG portraits with shared sprite previews; integrate controlled wardrobe picker and facing controls into handed-off onboarding and owned Shop presentation.
- [ ] Integrate owner-approved optional fields/save callback, verify round-trip and pending/failure behavior with UI fixtures and owner tests.
- [ ] Run movement, browser, axe, lint/types/build checks; fix material findings from a fresh review. Capture screenshots.
- [ ] Read board, commit owned files, fetch/rebase, push PR Closes #42, merge after checks, post handoff and verify deployment.

## Ledger

- Root cause: legacy PixelAvatar is a separate SVG renderer. prepareSprite's shortFlat deletes warm pixels within a fixed partial hair rectangle, affecting rear silhouette. New direct-implement request supersedes the earlier design approval gate.
- Ruling: starter pieces are free appearance choices, separate from purchased cosmetics; owner RPCs/economy stay unchanged. Optional config fields and owner callback requested on board.
