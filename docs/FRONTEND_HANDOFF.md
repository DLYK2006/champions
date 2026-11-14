# DIG IN frontend handoff

Issue #6 / PR #7. Human-approved cozy pixel-RPG presentation, built on the team's Next.js App Router + TypeScript + Tailwind scaffold. Jay owns this presentation layer; Daren approved scan/onboarding styling on the board and in AGENTS.md. Joshua's onboarding validation/auth/save handlers are preserved.

## Preview

Run `npm install` then `npm run dev`. Routes: `/` Home, `/scan` capture/results states, `/groups` optional community, `/shop` wardrobe, `/onboarding` welcome and real onboarding form.

Scan and Shop use their owners' real controllers. Joshua also owns the new Groups and Home controllers; their views keep the same typed props. UI fixtures remain separate from production data and must never award real coins. Onboarding keeps the owner's authentication/profile submission; browser checks stop before invoking it.

Issue #20 compacts the four main screens. Home contains the brand and wallet, with the wallet reading `profile.coin_balance`. Home, Scan and Community fit normal phone viewports; Shop scrolls. Food rows/editors scroll internally while Confirm Log stays visible. Short landscape screens and browser zoom retain access through internal panel scrolling. Only the selected navigation tab is green, with no dot.

## Presentation contracts

- `HomeScreen({profile, progress, group})` consumes the existing shared domain types. Completion flags, coin balances and streaks must come from owner APIs. The Home controller owner supplies these props; the brand/wallet now live inside this view. `DemoHome` is only a UI fixture.
- `ShopScreen({avatar, balance, owned, equipped, items, onBuy, onEquip})` supports authoritative async purchase/equip callbacks, pending/error states, and a free local try-on. Joshua's ShopController supplies authoritative inventory. `DemoShop` is only a UI fixture. `onBuy` receives an item ID plus display price; the server must continue to use its own price.
- `CommunityScreen({group, progress, members, onCreate, onJoin, onExploreSolo, onPreviewGroup?})` renders only member avatars/names/completion, not exact intake. Joshua's GroupsController feeds this view and owns the confirmed leave-group action (`onExploreSolo`, now labeled Leave group). Group names are limited to 2-30 characters in the view.
- `ScanView({status, error?, previewUrl?, onFile, onManual, onRetry, onDemo?})`: native file controls pass the selected File to Daren's handler; no reading, resizing or AI logic here. Gallery and camera controls use separate inputs.
- `ResultsView({result, mealType, previewUrl?, error?, pending?, onMealType, onUpdate, onRemove, onAdd, onBack, onConfirm})`: controlled item editing; `onConfirm(): Promise<void>` must reject on save failure and resolve only after the owner knows the result. No optimistic coin payouts. The controller supplies updated result totals after edits. An invalid/empty item list disables confirmation. Daren's ScanController owns processing and persistence; `DemoScan` remains an isolated UI preview.
- `AchievementDialog({achievement, onClose})`: call only for confirmed owner events, once per event ID. `preview: true` marks examples explicitly. It manages native dialog focus and Escape; it does not change coins or decide reward eligibility.
- `PixelAvatar({config, equipped, size, name, variant})` accepts existing AvatarConfig option IDs (hex with/without # supported); it is also exported as `Avatar`. All six configuration keys render visually. `RoomCharacter({config?, equipped, mood})` renders the original default sprite or a configurable full-body pixel character. Hoodie, sunglasses and crown IDs are unchanged.
- `Garden({progress, members?, name?})`: five presentation stages crossfade between original seedling/mature artwork. Reduced motion changes stages immediately. Progress and qualifying members come from the owner. Members render original CSS 3D cuboids with walking paths, overhead names and decorative speech bubbles. This is ambient animation, not live chat or multiplayer position syncing. Reduced motion shows static characters.

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

The compact and pending checks create temporary fixture routes and remove them in `finally`; they refuse to overwrite existing routes. Never publish fixture routes. Visual checks use explicitly mocked Home/Community/Shop presentation so live auth, membership and purchases are untouched. Checks cover phone/desktop/landscape geometry, active navigation, walking/reduced-motion 3D characters, result edits and invalid input, internal result scrolling, pinned confirmation, dialog keyboard/focus, rejected requests retaining edits/balance, and onboarding validation. Actual camera hardware, AI estimates, Supabase auth/persistence, realtime and production transactions stay with teammates and are not claimed as tested by these UI checks.

## Review decisions

A fresh reviewer found a pending create/join transition bug; a browser regression reproduced it, then passed after header transitions and openForm were locked during submission. The review's member-order assumption and zero-meal mood were corrected. Avatar configuration was added to the room/shop preview contract so custom appearances carry through to the room. No backend/domain/shared-type changes were needed.

The compact-layout review found clipped Home controls, results editors and garden characters on short landscape screens. The layout now keeps Home controls reachable, scrolls the result panel internally at short heights, and calculates walking paths within the garden's available height. Browser checks cover these regressions at 667x375 and 640x400.

After rebasing the latest ScanController, the signed-out setup notice is included in the flex layout so it cannot push capture controls or Confirm Log beneath navigation. The owner's setup link and auth logic are unchanged.
