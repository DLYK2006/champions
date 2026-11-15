# DIG IN original artwork

## adventurer-atlas.png (autonomous 2D overhaul, issue #31)

Generated with the built-in imagegen tool; original transparent 1536x1024 RGBA PNG, 6 columns by 4 rows. Directions: down, left, right, up. Columns: idle, blink, four walk phases. The renderer registers feet, samples with nearest-neighbor filtering, removes faint alpha matte noise while drawing, and caches palette/equipment variants. The existing environments were preserved. No external character art was copied.

Final generation prompt:

> Use case: stylized-concept. Asset type: production transparent sprite atlas for an original cozy 2D pixel RPG called DIG IN.
> Create ONE rigorously arranged sprite sheet, 6 columns by 4 rows, exactly 24 individual full-body sprites of the SAME young adult woodland adventurer. Landscape 1536x1024 canvas, each cell 256x256, no gaps or gutters, no grid lines. Transparent background everywhere except character pixels.
> Character: polished indie-game chibi proportions, large expressive head but real torso/arms/legs, wavy chestnut hair with an irregular appealing silhouette, warm tan skin, clear dark eyes and brows, a small kind smile, cream zip jacket with forest-green collar and cuffs, brown trousers, tan leather ankle boots, small sage backpack. Original design, rich deliberate 16-bit pixel clusters, warm top-left lighting, restrained 24-color earthy palette, strong readable silhouette, tidy 1-logical-pixel dark brown outline, 2-3 shade ramps, no anti-aliased painting. Draw at an implied 64x64 pixel grid per cell, enlarged nearest-neighbor 4x. High craft, not simplistic squares.
> Registration is critical: every character centered at x128 within its cell with the lowest foot at y232; each sprite roughly 112px wide x192px tall, same head size and body proportions throughout, transparent padding all around. NO shadows, NO ground, NO text, numbers, labels, borders or props outside the character. Never crop any hair/feet.
> Rows from top to bottom:
> 1 FRONT, facing viewer (south).
> 2 LEFT PROFILE, facing screen left (west), genuine profile anatomy, not front face.
> 3 RIGHT PROFILE, facing screen right (east), genuine profile anatomy.
> 4 BACK, facing away (north), back of hair and backpack visible, NO face.
> Within EACH row, columns left to right:
> 1 standing idle, eyes open, both feet planted.
> 2 standing idle identical pose but blink eyes closed (back row identical relaxed idle).
> 3 WALK contact A, left leg steps forward, right leg back, opposing arm swing.
> 4 WALK passing A, feet draw together, knee lifts, torso settles.
> 5 WALK contact B, right leg steps forward, left leg back, opposing arm swing.
> 6 WALK passing B, feet draw together, other knee lifts.
> Four walk frames must be visibly different coherent phases, a seamless gait, not six copies of a static character. Keep the head/torso aligned, no shape morphing. Side walk has clear stride silhouettes; back walk has alternating boot soles.
> Deliver only the precisely aligned transparent 24-sprite atlas, original high-quality pixel art, no background scene or UI.


Generated for the approved DIG IN frontend using the built-in imagegen tool on November 14, 2026. These backgrounds are original art, not screenshots or extracted assets from the supplied mood reference. All interface text, controls, characters and state indicators remain separate layers.

## adventurer.png

Final generation prompt:

> Use case: stylized-concept. Asset type: original transparent-background full-body player character sprite for DIG IN cozy pixel-RPG mobile app. One single friendly young adult adventurer, standing facing front in a relaxed happy pose, curly chestnut hair, warm medium skin, soft forest-green hoodie with cream drawstrings and a tiny golden leaf badge, dark brown trousers, cream sneakers. Chunky adorable original 16-bit pixel-art proportions with a large expressive head and small body, simple cheerful face and dark eyes, distinct square pixel clusters, limited warm earthy palette, crisp edges with no painterly smoothing. Entire character visible, centered, tightly framed with clear padding around all sides, character fills most canvas, no other objects. Truly transparent background; no backdrop, no floor, no oval shadow, no text, no logos, no border. Match a premium cozy woodland indie RPG art style. This is a game sprite asset, not a UI mockup.

## room.png

Final generation prompt:

> Use case: stylized-concept. Asset type: production background art for DIG IN, an original cozy pixel-art nutrition RPG mobile app. Create a beautifully art-directed original pixel-art cottage bedroom/study interior in landscape 3:2 composition. No UI, no lettering, no words, no logos, no characters. View nearly front on with a little floor depth, like a handcrafted 16-bit game diorama. A large wooden mullioned window on the left looks onto soft sage forest and sunlit hills, cream sunlight across honey oak floorboards. Forest-green quilt on a small bed at far left, books and a lantern. Right side cozy walnut bookshelf with small plants and jars, tiny mushroom-shaped table lamp. Trailing vines in upper corners. Small cream and sage circular woven rug in lower center, with deliberately open floor space for a separate animated character overlay. Warm cream, sage, deep forest green, chestnut brown and golden light. Clear chunky square pixels, tight consistent pixel grid, restrained limited palette, exquisite hand-placed pixel clusters, clean edges, no painterly smoothing, no heavy photorealistic texture, no blur. Composition readable at mobile width. Scene fills rectangular canvas edge to edge; no ornate outside frame. Charming original indie-game craft, inviting and premium.

## adventurer-base.png

Built-in edit of adventurer.png; transparent background preserved. Final prompt:

> Edit this original DIG IN pixel character sprite to create its unequipped base outfit. Preserve the exact character identity, curly hair, skin tone, expression, body proportions, pose, shoes, trousers, framing, pixel grid, canvas dimensions and transparent background. Change only the forest-green hoodie to a simple warm cream short-sleeved crew-neck T-shirt, with no logo, badge, drawstrings, hood or accessories. Keep the same arm position; exposed forearms use the existing warm skin tone. All other pixels and features should remain as close as possible to the original. Single full-body sprite, same scale and position, fully transparent background, no floor shadow, no text.

## garden-starter.png

Built-in edit of garden.png to support visible growth stages. Final prompt:

> Edit the supplied original DIG IN garden background into its starter growth stage. Preserve the exact landscape composition, camera, forest trees, wooden fences, four raised garden beds, central stone pedestal, path stones and pixel grid. Change only growth: remove all mature vegetables and most flowers from the four garden beds, revealing tidy warm brown soil with a few tiny green seedlings; replace the large central sprout creature with a much smaller sleeping seed creature with two tiny leaves, on the same pedestal. Keep the forest surroundings lush, warm sunbeams, same cream/sage/forest green/golden palette, same precise chunky pixel-art treatment. Keep all edges and objects aligned so it can crossfade perfectly into the source for game progression. No characters, no text, no UI, no border, no logos.

## garden.png

Final generation prompt:

> Use case: stylized-concept. Asset type: original production background scene for DIG IN cozy pixel RPG nutrition app. Create a beautiful landscape 3:2 pixel-art cooperative community garden clearing, original indie game aesthetic. No UI, no text, no lettering, no logos, no characters. A small gently elevated grassy clearing in lush sage and forest-green woodland with a tiny central friendly round sprout creature statue, cream stone footpath leading from foreground, four tidy garden plots filled with small vegetables and golden flowers around the central clearing, little wooden fence on the sides, warm sunbeams and tiny mushrooms. Leave open spaces beside the path for separate small member avatars. Clear distinct chunky pixel grid, hand-placed clusters, limited warm cream/forest green/sage/honey brown/golden palette, clean pixel edges, beautifully balanced light and shade. Charming, peaceful, richly crafted, premium 16-bit game environment. Canvas is entirely filled by scene, no border or external frame, no gradients or painterly blur. Readable as a mobile card. Do not include text or UI.
