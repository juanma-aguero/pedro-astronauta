# Pinos painted art

Generated with the built-in imagegen tool using the user's supplied September 7, 2026 scrapyard reference as visual guidance. The source image is not required at runtime.

- `scrapyard.png`: painted scrolling background, 1536 × 1024.
- `props.png`: chroma-green source atlas, 1536 × 1024. The existing green-matte decoder removes the background at boot; `PINOS_PROP_FRAMES` defines the four isolated regions. Do not display the entire raw atlas in-game.

The game retains its existing collision geometry, spawn positions, enemy behavior, Pedro animation atlas, and HUD. The plush is fitted to its existing fixed foot baseline. Floating platforms use three slices to preserve their end bolts. Ground is tiled independently inside each solid segment, leaving pits clear. The background uses mirrored copies for continuous scrolling and retains animated ember overlays.

## Generation prompts

### Background

Use case: stylized-concept. Create a production game BACKGROUND ONLY for a 2D side scrolling platformer, landscape 1536x1024. Match the supplied reference's lavish painterly 3D storybook quality, teal blue night sky, cyan moon, amber furnace lights, industrial toy scrapyard. Huge worn purple teddy bear half buried on the left, button eyes and stitched muzzle, densely layered salvaged gears, rusted scaffolding and crooked foundry towers, a hanging salvage claw near upper center, torn burgundy rabbit banner at right, distant rabbit silhouettes. Atmospheric depth, detailed tactile fabric and chipped metal, beautifully lit. Compose scenery from top through bottom; bottom 22% dark softly focused scrap heaps and warm mist, behind the playable ground. NO player, NO rocket, NO enemies, NO floating platforms, NO foreground floor, NO HUD, NO text. This is scenery to place BEHIND actual interactive sprites, not a screenshot. Left and right edges dark industrial structures for a mirrored scrolling panorama.

### Prop sheet

Use case: stylized-concept. Production 2D game asset sheet, 1536x1024, genuine TRANSPARENT background. Match reference painted cinematic 3D storybook industrial toy scrapyard style, richly detailed chipped blue gray steel, amber rim light and cyan moonlight. Four SEPARATE assets with generous transparent padding, strict quadrants: TOP LEFT (x 0-768 y 0-512) one squat patchwork robot plush enemy full body facing left, teal and rusty orange stitched cloth, square head with one red glowing lens and one X button eye, metal claw left arm, pink fabric right arm, little feet. TOP RIGHT (x 768-1536 y 0-512) one full upright rocket with red nose and fins, worn metal hull, luminous cyan circular porthole, landing legs and little ramp, full body. BOTTOM LEFT (x 0-768 y 512-1024) one wide horizontal floating platform slab, straight perfectly horizontal top, front orthographic game view, width about 660 height 120 centered in quadrant, scratched steel plates, big cross-head bolts at ends, worn diagonal ochre hazard paint, bright thin top rim. BOTTOM RIGHT (x 768-1536 y 512-1024) one rectangular ground section width 660 height 240 centered in quadrant, perfectly horizontal top, steel panels, worn hazard markings, recessed gears, hanging black cables contained in rectangle. No scene, no floor, no text, no UI, no extra objects, no cast shadows outside objects. Assets never touch quadrant boundaries.

### Matte correction (final prop sheet)

Edit this asset sheet. Preserve all four objects EXACTLY in their current positions, shapes, colors, dimensions and detail. Replace ONLY the entire white and gray checkerboard background with perfectly uniform solid chroma green #00ff00, including spaces inside and between objects. No checkerboard anywhere. No green on any object. Keep original 1536x1024 canvas layout. This is a technical chroma-key game sprite sheet.
