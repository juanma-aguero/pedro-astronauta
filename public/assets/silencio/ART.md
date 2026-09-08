# Silencio painted artwork

Generated with the built-in imagegen tool using the user's supplied moonlit Silencio reference.

- `caverns.png`: scrolling moonlit cavern panorama.
- `props.png`: Oscuro, noise device, floating ledge, and ground block.
- `landing.png`: rocket, bulb plants, and spires.

All images are 1536 × 1024. Prop sheets use a green matte removed at boot. Source regions are recorded in `SILENCIO_PROP_FRAMES` and `SILENCIO_LANDING_FRAMES`. The ground surface is cropped below decorative plants so the art follows the unchanged collider. The wider Oscuro illustration retains a fixed foot baseline and faces right before runtime flipping. Noise behavior, trigger geometry, HUD, and traversal tuning are unchanged.

## Background prompt

Use case: stylized-concept. Production painted BACKGROUND ONLY for a side-scrolling 2D game, 1536x1024. Use supplied image as visual reference: beautiful cinematic blue moonlit alien caverns, enormous cratered pale blue moon in upper right, dark navy sky with delicate stars, towering needlelike basalt spires, distant ancient eroded natural stone arches spanning deep ravines, many layers of blue mist. Nearer dark craggy cavern overhang at upper left with hanging stalactites; rounded black alien bulb plants among rocks. Richly detailed tactile fractured stone and cool silver rim lighting, atmospheric painterly 3D storybook finish. Scenery fills the entire image, bottom 25 percent softly focused dark ravine walls and blue fog. NO player, NO enemies, NO spaceship, NO HUD, NO text, NO floating playable platforms, NO foreground walkable floor, NO noise device. Background scenery only to sit behind real gameplay objects. Left and right edges dark rock silhouettes suitable for mirrored scrolling.

## Prop prompt

Use case: stylized-concept. Production game asset sheet 1536x1024 on PERFECTLY SOLID CHROMA GREEN #00ff00 background. Use reference's beautiful painterly 3D moonlit cavern game style: obsidian and blue basalt, silver blue rim lighting, detailed tactile stone. Four isolated objects with generous padding. Strict 2x2 layout. TOP LEFT within x40-720 y40-470: one complete side-view black mechanical quadruped creature FACING RIGHT, round turbine speaker head at RIGHT, pale radial blades, articulated dark segmented armor, four stubby jointed feet on one horizontal baseline, long curled tail at LEFT. Match reference creature, no humanoid. TOP RIGHT within x820-1460 y40-470: one compact worn metal sound-emitting device, little square box with round speaker grille and glowing amber pilot lamp, squat shape, no text, no sound rings. BOTTOM LEFT within x50-720 y600-930: one floating rock ledge, wide horizontal shape width660 height140, straight horizontal walkable top and rugged irregular underside, fractured dark blue basalt, silver-blue upper rim. BOTTOM RIGHT within x820-1470 y600-960: one solid rocky ground block, width650 height300, completely level top with blue rim light, vertical craggy layered black basalt face and a few small bulb plants at its upper edge. Orthographic front-facing game terrain, no perspective slant. No shadows outside assets, no scene, no floor, no HUD, no extra objects, no text. All green spaces between objects must be uniform #00ff00. Keep every object fully inside its designated quadrant.

## Landing prompt

Use case: stylized-concept. A 1536x1024 production game prop sheet on perfectly flat solid chroma green #00ff00. Reference image is style guidance. LEFT HALF: a complete upright rocket lander matching the reference, silver weathered cylindrical metal hull, pointed red nose, red landing fins, cyan luminous circular porthole, little deployed ladder ramp at bottom, detailed bolts, amber light on left rim and silver blue moonlight on right. Full rocket entirely within x100-680 y80-930. RIGHT TOP quadrant within x850-1430 y80-450: a cluster of four black alien bulb stalk plants growing from a few craggy blue basalt rocks, cool blue rim light. RIGHT BOTTOM quadrant within x850-1430 y570-940: a craggy thin jagged obsidian rock spire cluster with smaller loose boulders at its base, dark blue cool moonlight. Beautiful richly textured painterly 3D storybook game style. Orthographic side-view game sprites, no floor, no background scenery, no text, no HUD, no shadows outside objects. All objects isolated fully within their regions with broad green margins.

