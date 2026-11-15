# DIG IN autonomous 2D character design

The user supplied a complete specification and requested direct implementation. Replace the CSS cuboid garden characters and static room character with an original transparent, four-direction sprite atlas: idle, blink and four walk poses per direction. Preserve scene artwork and the existing AvatarConfig/equipped contracts. Keep the current compact app layouts.

Use Canvas 2D and one requestAnimationFrame loop per scene. Rendering uses cached sprites, crisp nearest-neighbor sampling, a feet anchor, a soft contact shadow and source-art coordinates. No game-engine dependency or React state update per frame. Home, Shop and achievements share the same sprite renderer; existing portrait configuration stays supported.

Trace conservative grass polygons against the actual 1536x1024 garden artwork. Plan destinations and collision-checked paths only inside these regions and the visible responsive crop. Stone paths split the grass into separate connected areas; actors stay on their own side rather than crossing stones. Random trips vary in distance and idle time, with smooth arrival/departure and occasional idle gazes. Background tabs and reduced motion stop the animation loop; cleanup cancels it and disconnects observers.

Canvas is preferable to Pixi/Phaser here: four ambient actors and static existing art need no physics/game engine. CSS patrol loops cannot satisfy randomized pathing or directional sprites. Names remain accessible DOM labels; animation is decorative and never changes group state. Preserve owner controllers, APIs, authentication, coins, camera and backend work. Restore the lead-requested non-null meal coach tip as one compact functional line.
