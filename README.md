# Pedro, el niño astronauta

A small 2D side-scrolling platformer for desktop browsers. Pedro, a 10-year-old
astronaut, travels between planets avoiding strange creatures and collecting
clues about his kidnapped family.

- MVP: [`docs/specs/001-playable-satenes-mvp.md`](docs/specs/001-playable-satenes-mvp.md)
- Multi-world + Pinos: [`docs/specs/002-pinos-and-multi-world.md`](docs/specs/002-pinos-and-multi-world.md)
- Silencio + noise/stealth: [`docs/specs/003-silencio-noise-stealth.md`](docs/specs/003-silencio-noise-stealth.md)

## Stack

TypeScript (strict) · Vite · Phaser 3 · Arcade Physics. No backend, no audio, no
persistence. Illustrated PNG assets are loaded once and prepared as Phaser
textures; planets without final artwork use procedural placeholder textures.

## Worlds

| World | Phases | Enemy | Art |
| --- | --- | --- | --- |
| **Satenes** | Phase 1 | Blue Monsters (patrol / chase / return) | illustrated PNGs |
| **Pinos** | Phase 1 | Heavy Metal Plushies (patrol / wind-up / charge / recover / return) | procedural placeholders |
| **Silencio** | Phase 1 | Oscuros (dormant / investigate / hunt / search / return) — hunt by **sound** | procedural placeholders |

Pinos is the home of the *Peluches Heavy Metal*: patched-together plush toys and
salvaged robot parts — colourful but slightly unsettling.

Silencio is a near-black, empty world where **noise is dangerous**. The Oscuros
are blind hunters that react to a lightweight in-game noise mechanic: moving
fast, jumping and (loudest of all) landing all make noise; holding **SHIFT**
walks slowly and almost silently. Oscuros run toward *where a sound was*, search,
then give up if Pedro stays quiet. The noise mechanic is entirely local to
Silencio — Satenes and Pinos are byte-for-byte unchanged. See "Replacing
placeholder art" below for both procedural worlds.

## Requirements

- Node.js 20+ and npm.
- A current desktop version of Chrome, Firefox, or Safari.

## Scripts

```sh
npm install
npm run dev        # Vite dev server
npm run build      # type-check + production build in dist/
npm run preview
npm run typecheck
npm test           # asset integrity + architecture invariants
```

## Controls

| Action | Keys |
| --- | --- |
| Move left | `A` or `←` |
| Move right | `D` or `→` |
| Jump | `Space` |
| Careful walk (Silencio only) | `SHIFT` + move |

No double jump, crouch, or attack. Pedro's movement, physics, health and
animations are identical in every world; `SHIFT` only changes his speed on
Silencio, through the generic `Player.setSpeedMultiplier()` capability, so the
other worlds never see it.

## Scene flow

```text
BootScene ─▶ MenuScene ─▶ WorldSelectScene ─▶ <selected phase scene>
                                                  │
                             ┌────────────────────┼────────────────────┐
                             ▼                                          ▼
                       GameOverScene                            LevelCompleteScene
                    REINTENTAR ─▶ same phase                REJUGAR FASE ─▶ same phase
              VOLVER A MUNDOS ─▶ WorldSelectScene     (SIGUIENTE FASE ─▶ next phase, when one exists)
                                                       VOLVER A MUNDOS ─▶ WorldSelectScene
```

`WorldSelectScene`, `GameOverScene` and `LevelCompleteScene` are entirely
data-driven: they read `WORLD_REGISTRY` and the `LevelRunContext` passed by the
running phase. No shared scene names a planet.

## Architecture: worlds and phases

| Concept | File |
| --- | --- |
| Which worlds/phases exist, and their scene keys | `src/game/planets/worldRegistry.ts` |
| `LevelRunContext` + helpers passed between scenes | `src/game/planets/levelNavigation.ts` |
| Shared level config types (`Position`, `PlatformConfig`, `BasePlanetLevelConfig`) | `src/game/planets/planetTypes.ts` |
| Per-planet level data | `src/game/planets/<planet>/<planet>Config.ts` |
| Per-planet scene | `src/game/planets/<planet>/<Planet>Scene.ts` |
| Per-planet enemy | `src/game/entities/enemies/*.ts` |
| Per-planet art | `src/game/art/<Planet>Art.ts` |
| Shared menu/result backdrop | `src/game/art/MenuArt.ts` |
| Asset sources with explicit paths | `src/game/config/artManifest.ts` |
| Namespaced texture keys | `src/game/config/assetKeys.ts` |

### Adding a new phase to an existing world

1. Create the scene + config, e.g. `src/game/planets/satenes/SatenesPhase2Scene.ts`
   and `satenesPhase2Config.ts` (config `extends BasePlanetLevelConfig`).
   Give the scene a module-level `RUN_CONTEXT` with its `worldId` / `levelId` /
   `sceneKey`, and start `GameOverScene` / `LevelCompleteScene` with it.
2. Register the scene class in `src/game/config/gameConfig.ts`.
3. Add a `LevelDefinition` to that world's `levels` array in `worldRegistry.ts`:
   `{ id: "phase-2", displayName: "FASE 2", sceneKey: "SatenesPhase2Scene" }`.

`WorldSelectScene` now shows a second button on that world's card, and
`LevelCompleteScene` now offers **SIGUIENTE FASE** after Phase 1. Nothing else
changes.

### Adding a completely new world

1. Create `src/game/planets/<planet>/`.
2. Create `<planet>Config.ts` — a `<Planet>LevelConfig extends BasePlanetLevelConfig`
   with world bounds, spawn, spaceship, platforms, clue, plus any planet-specific
   enemy/decoration arrays.
3. Create `<Planet>Scene.ts` mirroring `PinosScene`'s 12-step lifecycle. Reuse
   `Player`, `HealthHud`, and `PLAYER_TUNING`.
4. Create the enemy in `src/game/entities/enemies/` if the world needs a new one.
5. Create `src/game/art/<Planet>Art.ts` (scenery class with `update(scrollX)`,
   a terrain helper, decoration helpers) and, if using PNGs, add its sources to
   `artManifest.ts`; if using placeholders, add a `prepare<Planet>Art(scene)`
   generator and call it from `prepareArt`.
6. Register the scene in `gameConfig.ts`.
7. Append a `WorldDefinition` to `WORLD_REGISTRY`.

`MenuScene → WorldSelectScene` picks it up automatically. A world that needs its
own mechanic (like Silencio's noise) puts that logic in its own scene + a small
`src/game/mechanics/<name>/` module and composes it — it never edits `Player` or
the shared scenes.

## Silencio: the noise mechanic

- `src/game/mechanics/noise/noiseTypes.ts` — `NoiseEvent` / `NoiseKind` /
  `NoiseListener` + `isWithinEarshot()`.
- `src/game/mechanics/noise/NoiseSystem.ts` — framework-free: `emit()` broadcasts
  to listeners, `getMeter()` is a decaying 0..1 loudness for the HUD, old events
  are pruned. Unit-tested in `tests/noise.test.mjs`.
- `src/game/mechanics/noise/NoiseTrap.ts` — an environmental scrap pile; touching
  it emits one loud `environment` event on a cooldown (no damage).
- `src/game/entities/enemies/Oscuro.ts` — a `NoiseListener`. Reacts to sounds it
  can hear by walking toward *where the sound was* (never Pedro's live position),
  then `search`, then `return`. A 70–100 px close-range check is the only
  non-audio detection.
- `src/game/ui/NoiseHud.ts` — the **RUIDO** bar (Silencio only; `HealthHud` still
  shows **VIDA**).
- `SilencioScene` owns the tuning: `SHIFT` sets `player.setSpeedMultiplier(0.45)`,
  footsteps are derived from `player.isGrounded()` + body velocity on a cadence,
  and `player` emits `PLAYER_EVENTS.jump` / `PLAYER_EVENTS.land` which the scene
  turns into noise. `Player` knows none of this.

## Replacing placeholder art (Pinos & Silencio)

Both worlds ship with procedural textures generated in `prepare<World>Art`
(`src/game/art/PinosArt.ts`, `src/game/art/SilencioArt.ts`). To swap in final
PNGs for either:

1. Drop the files into `public/assets/<world>/` — e.g. Silencio wants
   `sky.png`, `ridges.png`, `terrain.png`, `props.png`, `oscuro.png`.
2. Uncomment / add their entries in `<WORLD>_ART_SOURCES` in
   `src/game/config/artManifest.ts` (key + path + `matte`).
3. Delete the matching `scene.textures.exists(...)` generator block in
   `prepare<World>Art` so the loaded image wins.

The scene and enemy code does not change.

## Where to tune the game

| Behavior | Source of truth |
| --- | --- |
| Movement speed, jump velocity, health, grace period | `src/game/config/gameplayTuning.ts` |
| Gravity, renderer, scaling, scene registration | `src/game/config/gameConfig.ts` |
| Satenes geometry / enemies / decorations | `src/game/planets/satenes/satenesConfig.ts` |
| Pinos geometry / enemies / decorations | `src/game/planets/pinos/pinosConfig.ts` |
| Silencio geometry / Oscuros / noise traps | `src/game/planets/silencio/silencioConfig.ts` |
| Heavy Metal Plush timings (wind-up / charge / recover) | `HeavyMetalPlushConfig` per enemy, defaults in `HeavyMetalPlush.ts` |
| Silencio noise values / cadence / slow-walk multiplier | constants at the top of `SilencioScene.ts` |
| Noise meter decay / event retention | `src/game/mechanics/noise/NoiseSystem.ts` |
| Oscuro speeds / hearing / search window | `OscuroConfig` per enemy, thresholds in `Oscuro.ts` |
| Texture keys | `src/game/config/assetKeys.ts` |
| Asset sources, atlas crops, animation framing | `src/game/config/artManifest.ts` |

## Project layout

```text
src/game/
  art/         MenuArt, SatenesArt, PinosArt, SilencioArt, prepareArt, artPixels
  config/      artManifest, assetKeys, gameConfig, gameplayTuning
  entities/    Player + enemies/{BlueMonster, HeavyMetalPlush, Oscuro}
  mechanics/   noise/{noiseTypes, NoiseSystem, NoiseTrap}
  planets/     planetTypes, worldRegistry, levelNavigation
               satenes/{SatenesScene, satenesConfig}
               pinos/{PinosScene, pinosConfig}
               silencio/{SilencioScene, silencioConfig}
  scenes/      BootScene, MenuScene, WorldSelectScene, GameOverScene, LevelCompleteScene
  ui/          HealthHud, NoiseHud, createTextButton
public/assets/
  common/      pedro.png, pedro-run.png, pedro-hurt.png   (shared, planet-independent)
  satenes/     sky, ridges, terrain, props, worm
  pinos/       (drop final PNGs here — procedural placeholders until then)
  silencio/    (drop final PNGs here — procedural placeholders until then)
```
