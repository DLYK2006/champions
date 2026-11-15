# Unified avatar and starter wardrobe

User requests direct implementation. Preserve the approved original sprite style, grass-only movement, all owner auth/validation/backend logic and existing purchased cosmetics.

Use one shared sprite renderer for onboarding, portraits, Home, garden, Shop and achievements. Fix rear hair at the renderer source: remove destructive partial hair clipping and register directional head layers consistently across frames. Keep source artwork intact.

Add two free starter designs in each slot: moss beanie / straw sunhat; linen shirt / forest jacket; denim cuffs / trail trousers; canvas sneakers / hiking boots. Reuse shaded sprite surfaces for clothing, legs and feet, with direction-aware pixel layers for hats and details. Hats replace one another; paid crown and hoodie retain precedence while equipped. All frames must remain shaded, grounded and consistent.

Onboarding has the same sprite preview with facing controls and clear selected choices. Shop has a compact starter wardrobe, instant local preview and explicit save through an owner-provided callback. Cancel/reset restores saved appearance; failures retain edits without claiming success. Keep paid items, prices and inventory callbacks unchanged.

Approach: extend existing Canvas drawing and appearance JSON, with optional owner-approved fields. Separate generated full-outfit atlases would multiply combinations and drift from the approved style; a game engine adds no value. No app dependencies, localStorage substitute for server state, schema changes or new auth/backend logic.

Verify rear frame silhouette registration, all wearable combinations in four directions and walking frames, onboarding preview updates, saved appearance propagation, failed/pending save states, accessibility, reduced motion and responsive geometry. Inspect actual screenshots/contact sheets; tests alone do not establish art quality.
