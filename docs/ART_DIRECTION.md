# Satenes illustrated art

The visual reference is the supplied purple alien landscape with a brown-haired
Pedro in a white/orange suit, a retro rocket, and a blue toothy worm. Art was
generated with the built-in image generation tool. The final prompt set is in
[ART_PROMPTS.md](ART_PROMPTS.md).

## Assets and rendering

All eight source PNGs are checked into `public/assets/satenes/`:

| Asset | Purpose |
| --- | --- |
| `sky.png` | Starfield and distant landscape, with planets removed |
| `ridges.png` | Independent rocky parallax layer |
| `props.png` | Rocket, planet, rocks, plant, clue, heart atlas |
| `terrain.png` | Floating ledge and ground cross-section |
| `pedro.png` | Idle and airborne poses |
| `pedro-run.png` | Four stride/passing poses |
| `pedro-hurt.png` | Brief recoil pose |
| `worm.png` | Six crawling poses |

The generator returned opaque pixels even when asked for transparency. The
selected sprite sources therefore use a green chroma matte. `prepareArt` removes
that matte once at boot, suppresses green edge spill, and creates reusable canvas
textures with alpha. Source art is retained unchanged. Generated character source
textures are released after the normalized animation atlases are ready.

`artManifest.ts` owns filenames, source frame rectangles, pose selection, and
physics dimensions. Pedro uses a 128×128 output cell with a foot baseline at 124;
the worm uses 128×96 with a baseline at 92. Their artwork is synchronized after
the physics update. Visual breathing, frame changes, and effects never scale or
move their collision bodies.

Ground and ledges use separate illustrated caps and a tiled center, positioned
at the unchanged collision surface. The ridge layers alternate mirrored copies,
so adjoining edges use matching pixels throughout the level. Scenery objects are
reused as the camera scrolls. Particle counts are bounded; scene shutdown owns
their cleanup. Character event listeners are explicitly removed on destruction.

## Gameplay invariants

- Pedro: 42×58 collision body; worm: 48×42; clue: 48×48 overlap area.
- Movement, jumping, gravity, health, invulnerability, enemy behavior, camera
  following, all 23 platform rectangles, and the seven enemy configurations remain
  unchanged.
- The rocket is decorative and now sits on the starting ground.
- The HUD reads actual health. All interface text remains live Phaser text.

## Verification

`npm test` checks the actual source PNG data, matte removal, atlas boundaries,
normalized frame fit, and original gameplay constants. `npm run build` checks
TypeScript and produces the deployable build. No additional dependencies are
needed for the asset tests.

Interactive browser verification could not run in the implementation sandbox:
localhost binding returned EPERM, the connected in-app browser was unavailable,
and isolated Chrome exited before rendering. The following checks remain for a
normal browser session using `npm run dev`:

1. Inspect title screen, hover JUGAR, start, and compare the opening area with
   the supplied reference. Check that no green fringes or atlas fragments appear.
2. Run both directions and jump; inspect foot alignment, stride transitions,
   jump/fall poses, dust, and landing edge alignment.
3. Traverse to the middle and end of Satenes. Inspect mirrored ridge seams,
   terrain joins, clear pit edges, enemy facing, and chase animation speed.
4. Take contact damage, check heart depletion and blink timing, lose all health,
   and retry. Fall into a pit and verify the original immediate restart behavior.
5. Collect the clue and replay. Repeat transitions several times to check for
   stale effects/listeners; resize the browser and inspect text and HUD placement.

In development, `window.game` is already exposed by `src/main.ts`. For collider
inspection, enable `scene.physics.world.drawDebug` and call `createDebugGraphic()`
on the active Satenes physics world from developer tools. This is not enabled in
the shipped game.
