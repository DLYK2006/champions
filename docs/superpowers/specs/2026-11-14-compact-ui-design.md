# Compact DIG IN revision

The human requested removal of promotional copy and panels, single-screen Home/Scan/Community, Shop-only page scrolling, Home-only DIG IN/coin header, and selected-tab-only green styling without indicator dots. They explicitly approved 3D block characters on the existing garden background, walking with overhead names and occasional decorative speech bubbles.

- Home: brand/coins, room with streak/customize action, nutrition bars and macro totals. Remove Small wins, garden crew preview, slogans, footers and redundant descriptions.
- Scan: short title, capture/upload/manual controls, scanning/error recovery. Results keep estimates, editable foods and confirmation; variable food lists can scroll within the screen so content is never clipped.
- Community: retain Good things grow together, group name, garden, completion/bonus progress and essential invite/create/join controls. Names and completion marks move onto characters; remove the duplicate crew list and prose.
- Garden: original CSS 3D cuboid characters, matched to AvatarConfig/equipped IDs, projected onto the existing artwork. Walk/pause/conversation cycles are presentation-only and never imply live chat. Reduced motion uses static named characters. No WebGL dependency is needed for four small characters; a full 3D garden was not selected.
- Shop: heading/balance, character try-on, category buttons, original pixel item artwork, names/prices/buy/equip states. No dropdowns or marketing descriptions; preserve the three server-backed item IDs and prices.
- Shell: viewport-sized content and persistent navigation. Only Home gets the brand/coin header. All four tabs use the same green selected treatment; inactive Scan is neutral. Shop owns page scrolling. Necessary form/error content remains reachable at high zoom or short viewport sizes.

Preserve all existing controllers, backend logic, authentication, reward/purchase rules, shared types and callbacks. Keep the user's existing local Home edit within the removed garden-preview block; its patch was backed up before updating main. Jay authorized Joshua's one-line ShopController route swap on the board; do not overwrite it.
