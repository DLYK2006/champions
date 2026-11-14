# DIG IN frontend handoff

Issue #6 / PR #7. Human-approved cozy pixel-RPG presentation, built on the team's Next.js App Router + TypeScript + Tailwind scaffold. Jay owns this presentation layer; Daren approved scan/onboarding styling on the board and in AGENTS.md. Joshua's onboarding validation/auth/save handlers are preserved.

## Preview

Run `npm install` then `npm run dev`. Routes: `/` Home, `/scan` capture/results states, `/groups` optional community, `/shop` wardrobe, `/onboarding` welcome and real onboarding form.

Home, Shop, Community and Scan currently use clearly identified frontend demo data. Demo balances/inventory last only while the app layout stays mounted; a reload resets them. Scanning previews do not read/process photos, call AI, persist meals or award coins. Onboarding retains the owner's real authentication/profile submission; the UI checks intentionally stop before invoking it.

## Replace demo wrappers with owner data

- `HomeScreen({profile, progress, group})` consumes the existing shared domain types. Completion flags, coin balances and streaks must come from owner APIs. `DemoHome` is the current route wrapper.
- `ShopScreen({avatar, balance, owned, equipped, items, onBuy, onEquip})` supports authoritative async purchase/equip callbacks, pending/error states, and a free local try-on. Replace `DemoShop` and `DemoProvider` when integrating real inventory. `onBuy` receives an item ID plus display price; the server must continue to use its own price.
- `CommunityScreen({group, progress, members, onCreate, onJoin, onExploreSolo, onPreviewGroup?})` renders only member avatars/names/completion, not exact intake. The new owner-provided `lib/groups` API can feed it without changing the view. `onExploreSolo` controls what the UI shows; it is not a backend leave-group call. Any actual membership change belongs to the owner controller.
- `ScanView({status, error?, previewUrl?, onFile, onManual, onRetry, onDemo?})`: native file controls pass the selected File to Daren's handler; no reading, resizing or AI logic here. Gallery and camera controls use separate inputs.
- `ResultsView({result, mealType, previewUrl?, error?, pending?, onMealType, onUpdate, onRemove, onAdd, onBack, onConfirm})`: controlled item editing; `onConfirm(): Promise<void>` must reject on save failure and resolve only after the owner knows the result. No optimistic coin payouts. The controller supplies updated result totals after edits. An invalid/empty item list disables confirmation. `DemoScan` is an isolated preview controller to replace.
- `AchievementDialog({achievement, onClose})`: call only for confirmed owner events, once per event ID. `preview: true` marks examples explicitly. It manages native dialog focus and Escape; it does not change coins or decide reward eligibility.
- `PixelAvatar({config, equipped, size, name, variant})` accepts existing AvatarConfig option IDs (hex with/without # supported); it is also exported as `Avatar`. All six configuration keys render visually. `RoomCharacter({config?, equipped, mood})` renders the original default sprite or a configurable full-body pixel character. Hoodie, sunglasses and crown IDs are unchanged.
- `Garden({progress, members?, name?})`: five presentation stages crossfade between original seedling/mature artwork. Reduced motion changes stages immediately. Progress and qualifying members come from the owner.

Shared presentation styles are in `components/ui/dig-in.css`, imported by the owned root layout. Pixelify Sans is self-hosted through the installed `next/font` integration; readable body text uses the scaffold's Geist font. No app dependency was added. Artwork and exact generation prompts are under `public/dig-in/` and `ARTWORK.md`.

## Verification

Standard checks: `npm run lint`, `npx next typegen`, `npx tsc --noEmit`, `npm run build`, `node --test lib/targets/targets.test.mjs`.

Browser checks use a separate temporary Playwright installation so the app dependency manifest is unchanged. With the dev server running, in PowerShell:

```powershell
$checkDir = Join-Path $env:TEMP 'digin-ui-check'
npm install --prefix $checkDir playwright @axe-core/playwright
node (Join-Path $checkDir 'node_modules/playwright/cli.js') install chromium
$env:NODE_PATH = Join-Path $checkDir 'node_modules'
$env:UI_CHECK_OUTPUT = Join-Path $checkDir 'screenshots'
node components/ui/ui.browser-check.cjs
node components/ui/tests/pending.browser-check.cjs
node components/ui/tests/accessibility.browser-check.cjs
```

The pending check briefly creates a test-only route and removes it in `finally`; it refuses to overwrite an existing route. Never publish that fixture route. Browser checks cover keyboard/dialog focus, responsive navigation/overflow, demo purchase/equip, no false preview coins, private/optional groups, invalid result guards and editing, scan loading/error/retry, onboarding validation/presets/avatar, and rejected pending group requests retaining retry details. Actual camera hardware, AI estimates, Supabase auth/persistence, live group updates and production reward transactions remain with teammates and are not claimed as tested by these UI checks.

## Review decisions

A fresh reviewer found a pending create/join transition bug; a browser regression reproduced it, then passed after header transitions and openForm were locked during submission. The review's member-order assumption and zero-meal mood were corrected. Avatar configuration was added to the room/shop preview contract so custom appearances carry through to the room. No backend/domain/shared-type changes were needed.
