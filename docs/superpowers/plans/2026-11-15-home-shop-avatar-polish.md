# Home controls, Shop catalog and side-facing avatars (#79)

User-directed follow-up, implement within existing style and owner APIs.

- Move unchanged AccountSection from Profile to Home header, ordered Sign out / Share / Coins. Replace spark with a conventional pixel share/export icon; preserve existing sign-out pending/error behavior and share dialog.
- Check 320px through desktop header fit and actual sign-out failure/retry using the dummy backend. No auth logic changes.
- Fix directional hair/hat/accessory defects in the shared renderer. Parallel avatar agent owns sprite-art.ts and isolated side-view tests; primary owns header/catalog/card art. Preserve PNG, all directions, body silhouettes and walking registration.
- Shop: All / Shirts / Pants / Hats, two new distinct purchasable items each: sage-sweater, rust-flannel, meadow-trousers, slate-cargos, acorn-cap, fisher-bucket. Retire Crown/old catalog from storefront, retain legacy ownership/rendering in Wardrobe. Do not resell universal free starter items.
- Coordinate real catalog rows/prices with backend owner. Frontend uses server items/prices and existing purchase/atomic outfit APIs, no fabricated purchasable rows or backend implementation. Extend category mappings/slot exclusivity for pants.
- Run focused real-controller/browser/visual/accessibility tests, tests for all six item directions/slot changes, tsc/lint/build after fixture cleanup, review and PR/deploy per team workflow.

Ledger: side-face mask defect reproduced (10 missing pixels) then fixed (zero); six paid item IDs change all 24 directional/walk cells while retaining body/face silhouettes. Existing wardrobe/art/frame regressions pass. Home logout/order and new six-row catalog/purchase/slot-save/reload tests pass with dummy backend, plus 320/390/768/1440 geometry and axe. Fresh whole-change review found no actionable issues. Backend issue #80 is assigned to Daren for real rows before merge; no catalog migration authored by frontend.
