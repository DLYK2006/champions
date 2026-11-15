# Profile redesign implementation plan

> Execute inline with superpowers:executing-plans; request one fresh whole-branch review.

**Goal:** Production Profile settings, owned wardrobe and shared calendar, with a purchase-only Shop and five-tab navigation.

**Architecture:** Existing guarded owner data APIs + controlled Profile presentation/drafts. Shared sprite, owned wardrobe picker and HistoryController. Owner-approved atomic outfit save and small refresh event; no new dependency.

**Spec:** docs/superpowers/specs/2026-11-14-profile-redesign.md

## Constraints / review focus

- All ownership/coins come from server except universal free starter choices; no new grants for rewards/protected fields.
- Preserve existing purchases and appearance; free slot choice removes only its paid overlay. Outfit save must not partially persist.
- Settings reuse target/unit helpers; explicit preset application only; age, username, stats and goal validation; no silent goal/target overwrites.
- Dirty Settings and Wardrobe drafts remain local, preserve each other, reset correctly, and cannot be edited during save. Refresh must not erase active drafts.
- One Calendar implementation; query-based section selection and legacy redirects must work with Next cache/Suspense and keyboard nav.
- Large avatar is complete and crisp; internal scrolling, five tabs and controls fit 320px/landscape/tablet/desktop and reduced motion.

## Tasks

- [ ] Coordinate settings/API, Shop/Home and History handoffs; inspect permissions/new migrations; record contracts.
- [x] Add failing navigation/Shop regression; implement five tabs, Home deep links/gold streak, purchase-only Shop and updated callers.
- [x] Build Profile route/controller/screen with shared large sprite, accessible accordions and query-based sections; test layout/guards/loading/errors.
- [x] Integrate validated settings and base appearance preview/save/reset via owner API; test units, goal/presets, validation and protected state.
- [ ] Move owned wardrobe/free defaults and paid equip into Profile, integrate atomic save/refresh, test pending/failure/reset/purchase synchronization.
- [x] Reuse/polish HistoryController within Calendar; redirect /history; test dates, month/selected details and stale streak.
- [ ] Run focused unit/browser/axe/layout/lint/types/build checks, fresh review and fix material findings; inspect screenshots.
- [ ] Read board, commit owned/handed-off files, fetch/rebase/push PR Closes #65, merge after checks and verify deployment; document required migrations/limits.

## Ledger

- Initial audit: current 0001 already grants username/stats/targets/avatar updates; 0005 grants unit/preferences only. No client coin/streak/equipped update permission. Settings API not yet in main; asked owner. History controller is reusable; asked owner for presentation/route handoff.
- Ruling: direct detailed request authorizes implementation without a new design approval round. Keep requested nav labels/order even while newer PRD uses alternative labels.

- Handoffs: Joshua authorized ShopController/lib/shop and Home refresh; Daren lead granted HistoryController + legacy route. PR #66 settings API includes sanitized avatar in one permitted profile save. Joshua owns pending migration 0008_save_outfit.sql save_outfit; UI consumes agreed {avatar,equipped} result and does not write equipped/coins directly.
- Validation: 43 unit tests passed; production controller flow covers purchase once, owned inventory, atomic outfit errors/retry, settings validation/errors/retry/reload and shared Calendar. Responsive/axe checks passed at 320/390/768/1440, exact unit round trips, independent drafts, resets, sign-out/incomplete guards, loading retry. Existing wardrobe art/frame, pending, navigation, compact/accessibility and solo/create/join onboarding regressions passed.
- Fresh review: section navigation changed to push for browser history; Home sharing is contained in a native dialog to prevent header overflow. Both findings addressed. Screenshots inspected at phone and desktop; full body visible.
- Verification note: production build overlapped a temporary-route browser check and failed generated route types after fixture cleanup. Run typegen/build again only after all fixture checks finish.

- Build re-run after fixture cleanup passed (all 12 static pages, no fixture routes). ESLint and TypeScript passed. PR #69 is preview-green; merge held until owner atomic RPC is applied and Home refresh handoff arrives.
- Lead follow-up (board #6888248272): Home now displays Bulk 90%+ calorie range, Maintain/Cut 90-110% range, protein 90%+ and server-flag completion marks. Over-target copy stays neutral. Browser regression went red before implementation, then passed; compact geometry and 320px screenshot checked. Final fresh review found no material residual issues.

- Integration update: owner PR #71 supplies 0008_save_outfit.sql (not the originally reserved 0009) and the Home profile-refresh listener. Merge/deployment waits for the owner to merge and apply that migration.
