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

- [x] Reproduce rear short-hair defect and old onboarding renderer in browser; add failing appearance/wardrobe regression and visual contact sheet.
- [x] Implement stable registered heads and eight direction-safe wardrobe options in shared sprite preparation; inspect all directions/frames and combinations.
- [x] Replace SVG portraits with shared sprite previews; integrate controlled wardrobe picker and facing controls into handed-off onboarding and owned Shop presentation.
- [x] Integrate owner-approved optional fields/save callback, verify round-trip and pending/failure behavior with UI fixtures and owner tests.
- [x] Run movement, browser, axe, lint/types/build checks; fix material findings from a fresh review. Capture screenshots.
- [ ] Read board, commit owned files, fetch/rebase, push PR Closes #42, merge after checks, post handoff and verify deployment.

## Ledger

- Root cause: legacy PixelAvatar is a separate SVG renderer. prepareSprite's shortFlat deletes warm pixels within a fixed partial hair rectangle, affecting rear silhouette. New direct-implement request supersedes the earlier design approval gate.
- Ruling: starter pieces are free appearance choices, separate from purchased cosmetics; owner RPCs/economy stay unchanged. Optional config fields and owner callback requested on board.
- Owner contracts: Daren added Avatar/StarterWardrobe on main; Joshua PR #48 added Home mapping and saveAvatar. Joshua authorized only the onboarding avatar-step import/state/markup and ShopController callback wiring (board 6887562135). Existing validation/auth/group logic untouched.
- Visual refinement: registered the complete 64px head/collar crop, eliminating leftover lower hair pixels. Added source-frame footwear bounds to avoid knee paint and distinguish low sneakers from boots. Small portrait thumbnails do not run animation loops.
- Review: two material legacy-state issues reproduced red and fixed green: explicit No hat/crown suppress the old cap; overall/graphicShirt do not claim Linen selected. Pure tests and actual rendered fingerprints cover both.
- Verification so far: 25 pure tests pass (wardrobe/navigation/Home/shop), all UI browser suites pass, and customizer axe/width checks plus intercepted solo/create/join/save/reload pass. Typecheck raced a removed temporary fixture route; rerun after fixture checks, then production build.
- Final local verification: regenerated types after fixture cleanup, typecheck and production build pass. Fresh reviewer rechecked both material fixes with no remaining material findings. All 16 full starter combinations render distinctly while preserving body alpha across 24 cells.
- New integration discovered before push: Daren's newly merged share card serializes the old SVG. Asked owner to switch that browser-only adapter to prepareSprite/drawSprite and CanvasImageSource; must integrate before merging #42.
