# Unified Profile, Wardrobe, Shop and Calendar

User supplied a detailed direct-implementation specification. Build production routes and reuse existing controllers/assets; no separate demo. Preserve camera/AI, achievements, groups, security and nutrition data.

Navigation: Home / Profile / Scan / Community / Shop. Home Customize links /profile?section=wardrobe; a gold clickable streak badge links section=calendar. /history redirects to that same Profile calendar, using one HistoryController and existing date helpers.

Desktop Profile: approximately 30% expandable Settings/Wardrobe/Calendar sidebar, 70% large original sprite stage with username, goal and Front/Left/Back/Right. Sidebar content scrolls internally; mobile puts the complete avatar above full-width sections. Calendar may expand the sidebar share for readability. Deep links, back/forward and keyboard accessibility must work.

Settings loads real profile, edits username/stats/units/goals/targets and base appearance, reuses lib/targets validators/presets, never changes custom targets without an Apply action, and saves only editable columns. Drafts preview locally, survive section switches, reset honestly and retain values on failure. No rewards or progress resets.

Wardrobe owns all eight free starter designs by definition, plus only actual purchased inventory. Owned items preview/select/equip by category; choosing a starter hat/top replaces the paid layer in that slot, preserving everything else. Save avatar and paid equipment together through owner-approved operations; never spend or grant coins. Existing accounts retain JSON appearance and purchases.

Shop removes the two-mode toggle and wardrobe editing. Keep all catalog items after purchase, show OWNED without primary price/Buy/Equip, preserve preview/filtering and server-authoritative buy. Link owned items to Wardrobe. Changes refresh relevant controllers through a small browser update event, without a new state package.

Approach: controlled presentation + existing owner APIs and a single calendar controller. A duplicate calendar/settings validation layer or global state library would add conflicting state. New schema is unnecessary unless the backend owner needs an atomic outfit RPC. Owner handoffs required for settings/shop/history/Home files; coordinate before edits.

Verify signed-out/incomplete guard, unsaved/reset/save/error states, all four sprite directions, free/paid ownership and duplicate buys, real controller data round-trips, stale streak/date handling, legacy history links, nav ordering and mobile/tablet/desktop accessibility/layout. Record migrations and unverified hardware/live transactions.
