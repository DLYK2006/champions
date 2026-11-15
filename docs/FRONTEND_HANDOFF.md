# DIG IN frontend handoff

Issue #6 / PR #7. Human-approved cozy pixel-RPG presentation, built on the team's Next.js App Router + TypeScript + Tailwind scaffold. Jay owns this presentation layer; Daren approved scan/onboarding styling on the board and in AGENTS.md. Joshua's onboarding validation/auth/save handlers are preserved.

## Preview

Run `npm install` then `npm run dev`. Routes: `/` Home, `/scan` capture/results states, `/groups` optional community, `/shop` wardrobe, `/onboarding` welcome and real onboarding form.

Scan and Shop use their owners' real controllers. Joshua also owns the new Groups and Home controllers; their views keep the same typed props. UI fixtures remain separate from production data and must never award real coins. Onboarding keeps the owner's authentication/profile submission; browser checks stop before invoking it.

Issue #20 compacts the four main screens. Home contains the brand and wallet, with the wallet reading `profile.coin_balance`. Home, Scan and Community fit normal phone viewports; Shop scrolls. Food rows/editors scroll internally while Confirm Log stays visible. Short landscape screens and browser zoom retain access through internal panel scrolling. Only the selected navigation tab is green, with no dot.

## Presentation contracts

- `HomeScreen({profile, progress, group})` consumes the existing shared domain types. Completion flags, coin balances and streaks must come from owner APIs. The Home controller owner supplies these props; the brand/wallet now live inside this view. `DemoHome` is only a UI fixture.
- `ShopScreen({avatar, balance, owned, equipped, items, onBuy, onEquip, onSaveAvatar?})` supports authoritative async purchase/equip callbacks, pending/error states, and free starter outfit previews. Joshua's ShopController supplies authoritative inventory and now wires the approved `saveAvatar` callback. `DemoShop` is only a UI fixture, without persistence. `onBuy` receives an item ID plus display price; the server must continue to use its own price.
- `CommunityScreen({group, progress, members, onCreate, onJoin, onExploreSolo, onPreviewGroup?})` renders only member avatars/names/completion, not exact intake. Joshua's GroupsController feeds this view and owns the confirmed leave-group action (`onExploreSolo`, now labeled Leave group). Group names are limited to 2-30 characters in the view.
- `ScanView({status, error?, previewUrl?, onFile, onManual, onRetry, onDemo?})`: native file controls pass the selected File to Daren's handler; no reading, resizing or AI logic here. Gallery and camera controls use separate inputs.
- `ResultsView({result, mealType, previewUrl?, error?, pending?, onMealType, onUpdate, onRemove, onAdd, onBack, onConfirm})`: controlled item editing; `onConfirm(): Promise<void>` must reject on save failure and resolve only after the owner knows the result. No optimistic coin payouts. The controller supplies updated result totals after edits. An invalid/empty item list disables confirmation. Daren's ScanController owns processing and persistence; `DemoScan` remains an isolated UI preview.
- `AchievementDialog({achievement, onClose})`: call only for confirmed owner events, once per event ID. `preview: true` marks examples explicitly. It manages native dialog focus and Escape; it does not change coins or decide reward eligibility.
- `PixelAvatar({config, equipped, size, name, variant, facing?})` is a compatibility wrapper around the same sprite used by the game scenes, also exported as `Avatar`. It no longer draws the old SVG portrait. Small thumbnails remain static without RAF loops. `RoomCharacter({config?, equipped, mood, room?, facing?})` renders the shared configurable full-body sprite. Home passes `room` to anchor the feet to the bedroom rug. Hoodie, sunglasses and crown IDs are unchanged.
- `Garden({progress, members?, name?})`: five presentation stages crossfade between original seedling/mature artwork. Reduced motion changes stages immediately. Progress and qualifying members come from the owner. Members render original directional 2D sprites with grass-only autonomous wandering and overhead names. This is ambient animation, not live chat or multiplayer position syncing. Reduced motion shows static characters.

Shared presentation styles are in `components/ui/dig-in.css` plus scoped `components/ui/compact.css`, imported by the owned root layout. Pixelify Sans is self-hosted through the installed `next/font` integration; readable body text uses the scaffold's Geist font. No app dependency was added. Artwork and exact generation prompts are under `public/dig-in/` and `ARTWORK.md`.

## Verification

Standard checks: `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, `node --test lib/targets/targets.test.mjs`.

Browser checks use a separate temporary Playwright installation so the app dependency manifest is unchanged. The real controllers need the public Supabase environment values to mount. For a signed-out UI-only test server without credentials, set process-only `NEXT_PUBLIC_SUPABASE_URL=https://digin-ui-test.supabase.co` and `NEXT_PUBLIC_SUPABASE_ANON_KEY=ui-only-test-key` before `npm run dev`; these placeholders cannot access backend data. The checks do not submit real auth, purchases or meals. With the dev server running, in PowerShell:

```powershell
$checkDir = Join-Path $env:TEMP 'digin-ui-check'
npm install --prefix $checkDir playwright @axe-core/playwright
node (Join-Path $checkDir 'node_modules/playwright/cli.js') install chromium
$env:NODE_PATH = Join-Path $checkDir 'node_modules'
$env:UI_CHECK_OUTPUT = Join-Path $checkDir 'screenshots'
node components/ui/tests/compact.browser-check.cjs
node components/ui/ui.browser-check.cjs
node components/ui/tests/pending.browser-check.cjs
node components/ui/tests/accessibility.browser-check.cjs
```

The compact and pending checks create temporary fixture routes and remove them in `finally`; they refuse to overwrite existing routes. Never publish fixture routes. Visual checks use explicitly mocked Home/Community/Shop presentation so live auth, membership and purchases are untouched. Checks cover phone/desktop/landscape geometry, active navigation, walking/reduced-motion 2D characters, result edits and invalid input, internal result scrolling, pinned confirmation, dialog keyboard/focus, rejected requests retaining edits/balance, and onboarding validation. Actual camera hardware, AI estimates, Supabase auth/persistence, realtime and production transactions stay with teammates and are not claimed as tested by these UI checks.

## Autonomous 2D characters (issue #31)

The garden now uses `components/world/garden-characters.tsx`, a Canvas 2D layer with accessible DOM names. `wander.ts` owns source-coordinate grass polygons, an inset feet footprint, a collision-checked navigation grid, path simplification, seeded random trips, varied pauses, gazes and smooth arrival/departure. Both garden stages share the same artwork coordinates. Stone paths split the connected grass into separate sides; actors never cross stones. Responsive cover mapping constrains destinations to the visible crop with sprite/name clearance.

`RoomCharacter` re-exports the shared 2D sprite component. Home, wardrobe, portraits, onboarding and achievements use the same original character atlas as the garden, with directional idle/walk frames, palette variants and existing equipment IDs. `PixelAvatar` preserves its props while rendering this shared sprite. Scene styles live in `components/world/scenes.css`; obsolete cuboid geometry/patrol styles were removed.

The scene loop mutates canvas/label positions without React renders per frame, and suspends for reduced motion or a hidden tab. Media preferences are cached between change events rather than polled in RAF, which avoids a Chromium change-event issue. Resize recomputes navigation in the same source coordinate system. This remains decorative client-side wandering, without backend or multiplayer position updates.

The mask excludes mature crop foliage as well as bed frames. Characters start apart, remain on their connected side of the stone path, and retain safe positions across data refreshes. Tall-phone garden proportions preserve visible grass; short/wide bedrooms align the background and feet to the bottom of the artwork. Name clearance is reserved in CSS pixels as well as sprite coordinates.

Additional checks: `node --test components/world/wander.test.mjs` and, against the dev server, `node components/ui/tests/sprites.browser-check.cjs`. The latter creates/removes a separate test route and must run sequentially with the other fixture/browser tests. The original sprite atlas and exact built-in generation prompt are in `public/dig-in/ARTWORK.md`.

Seven pure tests cover traced obstacle points, connected routing, responsive mapping, an hour of simulated wandering across six seeds, large deltas, resize and separated spawns. Browser checks cover real canvas frames and movement, pauses, all existing avatar option families and equipment, visibility/reduced motion, tall phones, landscape and bedroom feet registration. A fresh read-only review's two crop/anchor findings were reproduced and fixed, then reviewed again with no material residual findings. Screenshots were inspected against the mature garden mask and mobile bedroom.

## Unified avatar and starter wardrobe (issue #42)

`AvatarCustomizer({value: Avatar, onChange})` is controlled presentation in `components/avatar/`. Onboarding's fourth step uses it; existing validation, auth, profile insertion and optional-group handlers remain unchanged. Joshua explicitly authorized that narrow markup/state-type change and the ShopController callback wiring on the board. Daren owns the new shared `Avatar = AvatarConfig & StarterWardrobe` type; Joshua's merged PR #48 owns persistence, sanitization and Home mapping.

Eight free appearance choices are in `wardrobe.ts`: moss beanie / straw sunhat, linen shirt / forest jacket, indigo / cocoa trousers, canvas sneakers / hiking boots. Values live in existing `profiles.avatar` JSON, using optional `hat`, `pants`, `shoes` plus existing `clothing`. No starter inventory rows, coin spending, migration or new dependency are needed. The existing coin shop and purchased equipment continue through their original handlers. Equipped crown/hoodie override their respective base outfit slots; the UI explains this when relevant.

The sprite prepares a registered directional head across walking frames, safely trims only outer hair edges, and shades actual painted clothing/leg/foot surfaces. Frame-specific footwear bounds follow raised and planted feet, giving sneakers a lower cut without knee-color bleed. Hats layer over the head with direction-specific registration. Explicit No hat suppresses a legacy cap; legacy outfits never claim a different starter selection. The source PNG stays unchanged.

Shop offers Coin shop / Starter wardrobe views, immediate previews and facing controls. Save awaits the owner's authoritative callback; failed saves retain the draft, pending saves disable conflicting choices, Reset restores the saved appearance. On desktop the larger avatar frame stretches from the catalog top to its bottom; mobile stacks the preview above controls and keeps Shop scrolling.

Checks: `node --test components/avatar/wardrobe.test.mjs`; `node components/ui/tests/wardrobe.browser-check.cjs`; `node components/ui/tests/onboarding-wardrobe.browser-check.cjs`. The wardrobe check uses a temporary route with cleanup. It checks all four directions/six frames, all 16 full outfit combinations, unchanged body silhouettes, legacy cap/crown behavior, save/reject states and frame geometry. The onboarding check intercepts only the dummy UI Supabase host; it exercises real owner controllers for age 17 rejection, solo/create/join, identical saved avatar pixels on Home and reload, and Shop save/reload without paid RPCs. It never creates live accounts or modifies production data. Customizer axe A/AA and 320/390/1440 width checks pass. Real Supabase wardrobe persistence was separately checked by the owner in PR #48; no new live-transaction claim is made here.

Daren's share-card adapter (PR #58) now uses the shared sprite preparation/drawing functions directly, rather than serializing the removed SVG portrait. The intercepted browser check also verifies the actual /history share preview (1080x1350), Download filename and Close flow after saving an outfit. No native share message is sent by the test.

## Review decisions

A fresh reviewer found a pending create/join transition bug; a browser regression reproduced it, then passed after header transitions and openForm were locked during submission. The review's member-order assumption and zero-meal mood were corrected. Avatar configuration was added to the room/shop preview contract so custom appearances carry through to the room. No backend/domain/shared-type changes were needed.

The compact-layout review found clipped Home controls, results editors and garden characters on short landscape screens. The layout now keeps Home controls reachable, scrolls the result panel internally at short heights, and calculates walking paths within the garden's available height. Browser checks cover these regressions at 667x375 and 640x400.

After rebasing the latest ScanController, the signed-out setup notice is included in the flex layout so it cannot push capture controls or Confirm Log beneath navigation. The owner's setup link and auth logic are unchanged.


## Unified Profile, purchase-only Shop and Calendar (issue #65)

Production navigation is Home / Profile / Scan / Community / Shop. `/profile?section=settings|wardrobe|calendar` selects a sidebar section, with browser history support. Home Customize opens Wardrobe; the gold streak control opens Calendar; `/history` redirects to that same controller. Share is accessible from Home in a native dialog.

Profile uses the existing sprite renderer, shared AppearancePicker, owner `lib/settings` load/save/validation/units/presets, and real shop inventory/catalog. Settings and outfit drafts are independent; saving either merges only its appearance or clothing fields and preserves the other's unsaved edits. Eight free starter items are universally owned; paid choices appear only from inventory. `lib/shop.saveOutfit` calls owner `save_outfit(p_avatar,p_equipped)` atomically and emits the shared profile refresh event. Coins, streak, meals, group state and inventory ownership are never patched by Profile. The backend owner supplies migration 0008_save_outfit.sql for this RPC; it must be applied before Wardrobe saves are deployed. Existing profile grants and 0005 settings permissions are sufficient; no broadened client grant.

Shop has one purchase catalog. Owned rows remain visible with OWNED and a Wardrobe link; price/Buy is only for unowned items, with a synchronous in-flight guard and server-price purchases. The larger preview frame still matches the catalog height. Home, Shop and Profile refresh through the owner's profile update event plus route loads.

New checks: `node components/ui/tests/profile.browser-check.cjs`, `profile-responsive.browser-check.cjs`, and `profile-navigation.browser-check.cjs` (same directory and external Playwright setup above). Backend interception is restricted to the dummy digin-ui-test host. They cover real production controllers, authoritative-price purchases, failed save retention/retry, independent drafts, resets, metric/imperial round trips, persisted looks, auth/onboarding guards, five-tab geometry, full-body avatar visibility and axe at 320/390/768/1440. Existing onboarding/wardrobe/art and pending regressions were adapted to Profile. Run fixture-based checks sequentially and finish all of them before type generation/build; fixture routes must never be deployed.

Home goal guidance follows the lead's 0007 presentation request: Bulk shows a minimum with no maximum, Cut/Maintain show the 90-110% range, protein shows its minimum. Goal-met labels use daily_progress completion flags, never a client-derived reward decision. `home-goals.browser-check.cjs` verifies differing goal types, stale-looking amounts with false server flags and dialog keyboard close.


## Profile collapse and Calendar date selection (#74)

An active Profile accordion can be closed (`section=none`); Settings and Wardrobe drafts stay mounted and are preserved. Section navigation preserves Calendar query filters and browser history.

Calendar no longer displays the color legend. The default view is analysis selection for all dates; applying both From/To fields selects an inclusive range. `from=YYYY-MM-DD&to=YYYY-MM-DD` is the public URL contract. Clicking a calendar date adds `date=YYYY-MM-DD` and displays that day's existing meal details; Back to analysis removes date and retains the range. All dates clears all three filters. Invalid/partial/reversed/future ranges cannot be applied. Invalid shared URL dates fall back to all-date selection. Results are tagged with their date so browser navigation never renders a previous day's meals under a new heading.

Daren owns the future Databricks connection; Jay explicitly deferred it. `HistoryController` accepts optional `renderAnalysis(range)` with typed `AnalysisRange = {kind:'all'} | {kind:'range',from,to}` from `components/history/analysis-selection.ts`. The slot is currently empty: only the chosen scope is displayed, with no fabricated analytics or new API/backend calls.

Regression: `node --test components/history/analysis-selection.test.mjs`; `node components/ui/tests/calendar-filters.browser-check.cjs` with the existing external Playwright setup. Browser checks cover all accordion toggles, retained drafts, default/range/day/reset modes, validation and responsive axe checks.
