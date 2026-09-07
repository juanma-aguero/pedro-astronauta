# Asset generation prompts

Tool: built-in `image_gen` (no external API key or CLI generation).
Style reference: the user's second supplied image, the illustrated Satenes scene.
All final assets are saved in `public/assets/satenes/`. The original generated
files remain at their tool-provided locations. Runtime atlas preparation is
documented in [ART_DIRECTION.md](ART_DIRECTION.md).

The prompts below record the generation and edit requests used for the selected
assets. Images are style/identity references unless explicitly called edit targets.

## sky.png

Initial background generation:

> Create a production-ready 2D side-scrolling game BACKGROUND illustration matching the attached Image #2 art direction: rich hand-painted cartoon alien world, midnight navy star-filled sky with subtle indigo nebula, enormous luminous cratered lavender planet in upper right, atmospheric layers of purple rock spires and distant low mountains, violet mist. Full landscape 1536x1024 or wider 16:9 composition, scenic mountain horizon in bottom quarter, upper 65 percent mostly sky. No characters, no rocket, no enemies, no platforms, no ground strip, no interface, no letters, no text. This is background-only artwork for a playable game with other objects composited separately. Beautiful textured brushwork, sophisticated purple and blue lighting, crisp illustrative detail like the supplied reference. Make left and right edges similar darkness and landscape height so repeating panorama is unobtrusive. Save generated output and return local path.

Final edit, using the generated background as the edit target:

> Edit this background illustration for layered game rendering. REMOVE the large glowing planet and its rings and asteroids in upper right, fill that region naturally with the same midnight navy starfield and subtle indigo nebula. Remove the smaller planet on left as well. KEEP all of the mountain landscape, composition, colors, lighting, sky stars, painterly texture and canvas dimensions unchanged. No new objects, text, platforms or characters. The planets will be rendered separately as game sprites.

## pedro.png

Initial sprite sheet generation:

> Use case: stylized-concept. Asset type: production game sprite sheet, exactly 4 columns by 2 rows, all 8 cells equal size, on genuinely transparent background with alpha (no checkerboard painted in). Primary request: same adorable 10 year old brown-haired boy astronaut as the user's reference Image #2, white/light gray spacesuit with orange trim, bare head with tousled brown hair, large expressive brown eyes, small backpack, chunky boots, detailed painterly cartoon illustration, purple rim light. Full body strictly SIDE VIEW facing RIGHT in EVERY cell, consistent character identity, consistent scale and lighting, no helmet. Exactly 8 poses in reading order: row 1: relaxed idle; second idle breathing; run contact right foot forward; run passing pose. Row 2: run contact left foot forward; run passing opposite pose; airborne jump with bent legs; airborne falling with arms slightly raised. Each cell has identical dimensions; boots end on SAME baseline near 90 percent of cell height in standing/running poses; head at same height; centered with generous clear transparent margin. No frame borders, no text, no labels, no shadows outside sprites, no scenery, no extra objects. Clean accurate anatomy, distinct readable strides. This sheet will be cut into equal frame rectangles in Phaser, so precise grid and stable alignment essential. Landscape 1536x1024.

Final matte correction, using that sheet as the edit target:

> Edit this existing astronaut sprite sheet. Preserve every character pixel, pose, scale, position and the exact 1536x1024 canvas. Remove the checkerboard background completely and replace with a genuinely transparent alpha channel. The gray white checker pattern in the source is NOT transparency and must be removed. If you cannot emit actual alpha, use an absolutely flat solid vivid pure green RGB(0,255,0) #00FF00 background everywhere outside the characters, with no texture, checkerboard, shadows or gradients, as a chroma key matte for the game renderer. Never draw a checkerboard. No other changes.

## pedro-run.png

Reference: the selected Pedro sheet above.

> Create a RUN CYCLE animation sprite sheet for the EXACT same brown-haired child astronaut in the attached reference, white suit orange trim, dark boots, no helmet. 1536x1024 with exactly FOUR frames in a 2 by 2 grid of equal 768x512 cells, every character full body, side view facing RIGHT, same identity and same size. The four poses MUST BE DISTINCT successive walk/run cycle poses, not duplicates: TOP LEFT CONTACT: right leg far forward heel about to contact floor, left leg stretched backward, left arm forward. TOP RIGHT PASSING: body upright over straight right planted leg, left knee lifted forward and foot tucked under body, arms close to torso. BOTTOM LEFT OPPOSITE CONTACT: left leg far forward, right leg stretched behind, right arm forward. BOTTOM RIGHT OPPOSITE PASSING: body upright over straight left planted leg, right knee lifted forward, foot tucked under body. In passing frames legs are CLOSE TOGETHER horizontally, not wide split. Keep head size and position stable relative to cell, no speed lines, no shadow, no text or grid. Detailed painterly cartoon with crisp outlines and subtle violet rimlight, production game sprite quality. Uniform pure green #00FF00 background for chroma key, no checkerboard. Each sprite fits well inside its cell with at least 60px clearance.

## pedro-hurt.png

Reference: the selected Pedro sheet.

> Generate a single full-body HURT RECOIL pose of exactly the same brown-haired boy astronaut in this sprite reference: white/light gray suit with orange accents, orange-trim boots, tousled brown hair, expressive eyes, small backpack, child proportions. Facing RIGHT, eyes squeezed closed, leaning back slightly, hands raised in startled recoil, no injury or blood. Detailed hand-painted cartoon sprite with purple rim light, keep identity and outfit of reference. Centered full body with ample margin. Plain uniform pure green #00FF00 chroma key background, absolutely no checkerboard, no scenery, no shadows outside silhouette, no text. 1024x1024 canvas.

## worm.png

Reference: the user's illustrated scene.

> Use case: stylized-concept. Game animation sprite sheet exactly 3 columns and 2 rows, canvas 1536x1024, six equal 512x512 cells, no grid lines. Same BLUE ALIEN WORM creature from the reference: plump segmented cobalt/cyan body, enormous circular mouth ringed in rounded ivory teeth, deep maroon mouth, tail tapering behind it, cartoon menacing but kid-friendly, no gore. Detailed hand-painted cartoon illustration, crisp dark outlines, pink-purple rim lighting. All six frames SAME creature facing RIGHT, mouth on RIGHT and tail on LEFT, side view. Six successive phases of crawling: extended low, gathering rear segments, compressed taller, pushing head forward, extended, settling. Consistent head size and body identity, roughly 400 pixels wide and 230 tall each; each creature centered horizontally in its cell with lowest contact point at y=400 relative to cell. Entire creature in each cell, generous clear margins, no cast shadows outside body, no dirt particles. Absolutely flat solid vivid pure green #00FF00 matte background for chroma key, no green on character, NO checkerboard, NO text, NO extra objects. Reference used only for art style and creature design, not screenshot layout.

## props.png

References: generated artwork and the supplied art direction.

> Production sprite atlas for a hand-painted cartoon alien platform game. Exactly 3 columns by 2 rows of separate assets, each fully inside its equal 512x512 cell, wide clear empty margins, no touching neighboring cells. Canvas 1536x1024. Background MUST be uniform pure green #00FF00 chroma key, no checker pattern, no ground shadows, no green on objects. Consistent rich painterly illustration, deep purple shadows, pink/lavender rimlight, crisp outlines, match supplied alien world and astronaut. Row1 col1: detailed small retro white/silver and orange rocket, upright on landing legs, open lower hatch with short ramp, big circular dark blue window, thin antenna with orange light, entire rocket visible. Row1 col2: huge round luminous cratered purple planet with faint lavender rim glow, isolated, no rings extending out of cell. Row1 col3: cluster of angular dark violet rocks with pink upper edges, low wide silhouette. Row2 col1: bioluminescent purple alien plant, three graceful pink glowing fronds growing from dark violet rock base, full silhouette. Row2 col2: floating golden faceted diamond clue collectible, amber core, modest light rays. Row2 col3: glossy red/pink heart health icon, friendly rounded 3D painted highlights. No UI, no text, no letters, no labels, no panel borders. Assets isolated on perfect flat pure green.

## terrain.png

Reference: the user's illustrated scene.

> Production game terrain asset sheet, 1536x1024. Painterly detailed purple alien rock platforms matching reference. Exactly TWO long horizontal floating rock strips, one in upper half, one in lower half, on absolutely solid pure green #00FF00 background (chroma key), no checkerboard. Upper strip: entire platform from x=64 to x=1472, horizontal perfectly level luminous lilac/pink top edge at y=190, rich purple cratered stone face below to y=280, darker clustered angular violet rock underside ends around y=350; rounded end caps at left and right. Lower strip: long ground cross-section x=64 to1472, perfectly level pink/lavender walkable top edge at y=610, dark purple pitted soil/rock texture beneath continuing as rectangular block to y=960, subtle scattered purple rocks within material, flat bottom. Top surfaces must be visibly horizontal, side-on orthographic game view, no perspective slope, no scenery, no plants, no characters, no labels, no text, no border. Detailed hand-painted cartoon illustration, pink top rim, deep navy purple underside, coordinated with reference. The center of each strip should have even lighting and repeatable rock texture suitable for horizontal tiling; decorate ends distinctly. All outside strip pixels pure green.

## ridges.png

Reference: the user's illustrated scene.

> Production parallax layer for illustrated 2D alien platform game. 1536x1024 landscape. A continuous band of purple alien rocky foothills and jagged spires across the BOTTOM HALF, silhouetted upper edge varies between y=400 and y=720, opaque rocky surface fills everything below to bottom edge. The TOP half around and above spires is absolutely flat pure green #00FF00 chroma matte, NOT sky, no stars or planets. Purple indigo painterly rock, atmospheric softer dark blue shadows, subtle lavender rimlight, match reference Image #2. LEFT and RIGHT edges must be at same low ridge height y=670, with evenly shaded purple rock to bottom, suitable for horizontal repeat. Most tall spires toward left third and right third, center lower. No characters, no buildings, no platforms, no text, no grass, no flowers. Keep layer fairly dark and muted so playable foreground reads clearly.
