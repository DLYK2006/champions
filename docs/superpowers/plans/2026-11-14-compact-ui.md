# Compact DIG IN implementation plan

**Goal:** Apply the approved compact revision and 3D garden motion with the smallest complete frontend change.

**Architecture:** Reuse existing typed views/controllers. Simplify view markup and replace obsolete screen CSS with scoped compact layout rules. Implement a reusable CSS cuboid character and garden walking timelines; no new dependencies.

**Spec:** docs/superpowers/specs/2026-11-14-compact-ui-design.md

**Constraints:** presentation only; preserve shared types, APIs, camera/AI/auth and purchase/reward logic; respect approved ownership handoffs and reduced motion.

1. Verify current code/board and protect the local Home edit. Read real ScanController and coordinate shop route ownership.
2. Add a browser regression for single-screen layouts, selected-only green tabs, removed panels/header/copy, named 3D characters and reduced motion; observe failure before implementation.
3. Simplify Home and shell; compact capture/results and Community while retaining form/error/async guards. Keep Shop scrollable and callbacks unchanged.
4. Add CSS 3D characters and original cosmetic artwork using existing AvatarConfig/equipped IDs; use walking/turning/pause/bubble timelines without live-chat claims.
5. Check phone/desktop screenshots and content bounds, keyboard/reduced motion, errors and integrations. Run lint/types/build and relevant browser checks. Request a fresh read-only review and fix material findings.
6. Board unread, fetch/rebase, stage own files only, push issue branch, PR Closes #20, author merge after checks. Post relevant presentation handoff.

Review focus: small-height/keyboard access without clipping; live controllers preserved; pending input/error guards retained; long names and 3D walking bounds; reduced motion and active tab semantics. Execution is inline under the user's approved changes.
