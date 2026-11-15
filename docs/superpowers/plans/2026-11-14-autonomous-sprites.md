# Autonomous sprites implementation plan

> **For agentic workers:** Execute inline with superpowers:executing-plans; request a fresh whole-branch review at the end.

**Goal:** Replace block characters with polished directional sprites and natural, collision-safe grass wandering.

**Architecture:** Shared cached sprite drawing, pure source-coordinate navigation/state machine, one canvas scene loop with resize/visibility/reduced-motion lifecycle handling. Existing typed view/controller contracts remain unchanged.

**Tech Stack:** Next.js, TypeScript, React, Canvas 2D, node:test, external Playwright. No app dependencies.

**Spec:** docs/superpowers/specs/2026-11-14-autonomous-sprites.md

## Constraints and review focus

- Grass-only feet collisions, including every path segment and conservative obstacle clearance; separate connected sides.
- Responsive cover cropping must never leave actors or labels off-screen. Resize reprojects safely without movement jitter.
- Proper source frames and foot registration, all four facings, real idle/walk animation; no old CSS cuboids or keyboard movement.
- Preserve avatar colors/equipment, app data, controls and owner callbacks. Reduced motion/hidden tabs cancel animation; unmount releases observers/RAF.
- Test different seeds, long simulated wander runs, pauses, low-frame-rate deltas, narrow/short viewports and image loading failures.

## Tasks

- [x] Generate and inspect original transparent directional sprite artwork. Save atlas and prompt in public/dig-in.
- [x] Write failing pure navigation tests, implement grass mask, segment/path validation, random target selection and delta-time idle/walk controller; verify long simulated runs.
- [x] Write a browser regression for real sprite frames, autonomous movement, collision bounds, room sprite, reduced motion and resize. Observe failure, implement shared sprite drawing and scene integration, remove obsolete cuboid rendering/CSS. Confirm no keyboard listeners in either renderer.
- [x] Preserve avatar/equipment presentation and restore the compact non-null coach tip with a focused check.
- [x] Inspect screenshots and motion in desktop/mobile/landscape; run meaningful browser/accessibility, lint/types/build checks and a fresh read-only review. Fix material findings.
- [ ] Read board; stage only owned changes, commit, fetch/rebase, push issue branch, PR Closes #31, merge after checks and post handoff.
