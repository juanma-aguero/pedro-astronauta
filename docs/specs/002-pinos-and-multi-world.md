# Specification 002: Pinos and the multi-world architecture

## Status

Implemented.

## Objective

Add the second planet, **Pinos**, and make the minimum architectural change
needed to support multiple worlds and multiple phases per world. Satenes
gameplay and visual quality are preserved unchanged.

Scope for this iteration: `Satenes / Phase 1` and `Pinos / Phase 1` only. The
architecture must make `Satenes / Phase 2…`, `Pinos / Phase 2`, and future
worlds additive — no rewrite of menu navigation, result screens, BootScene, or
shared player code.

## Architecture changes

### 1. World registry (`src/game/planets/worldRegistry.ts`)

`WORLD_REGISTRY: readonly WorldDefinition[]` is the single source of truth for
which worlds and phases exist and which Phaser scene runs each. Helpers:
`getWorld(id)`, `getLevel(worldId, levelId)`, `getNextLevel(worldId, levelId)`
(next phase within the same world, or `undefined`).

Navigation never branches on a hard-coded world id.

### 2. Shared level types (`src/game/planets/planetTypes.ts`)

`Position`, `PlatformConfig`, and `BasePlanetLevelConfig` moved out of
`satenesConfig.ts`. `BasePlanetLevelConfig` holds only genuinely shared fields
(world bounds, spawn, spaceship, platforms, clue). Planet-specific enemy and
decoration arrays live in each planet's own config:

- `SatenesLevelConfig extends BasePlanetLevelConfig` → `enemies: BlueMonsterConfig[]`, `decorations`
- `PinosLevelConfig extends BasePlanetLevelConfig` → `enemies: HeavyMetalPlushConfig[]`, `decorations`

`BasePlanetLevelConfig` has no dependency on any enemy type.

### 3. Level run context (`src/game/planets/levelNavigation.ts`)

```ts
interface LevelRunContext { worldId: string; levelId: string; sceneKey: string; }
```

`toRunContext(worldId, levelId)` builds one from the registry.
`isLevelRunContext(x)` guards `scene.start` data. `firstRunContext()` is the
registry-derived fallback for the result screens.

Each phase scene owns a module-level `RUN_CONTEXT` constant and passes it to
`GameOverScene` / `LevelCompleteScene` via `scene.start(key, RUN_CONTEXT)`.

### 4. Scene flow

`MenuScene` (JUGAR) → `WorldSelectScene` → selected phase scene.

- `WorldSelectScene` renders one card per `WorldDefinition` and one button per
  `LevelDefinition`, all from the registry. `VOLVER` → `MenuScene`.
- `GameOverScene` reads the context: `REINTENTAR` restarts `context.sceneKey`;
  `VOLVER A MUNDOS` → `WorldSelectScene`. It stops `context.sceneKey` on entry.
- `LevelCompleteScene` shows `¡Encontraste una pista!`, `REJUGAR FASE`, and
  `VOLVER A MUNDOS`. If `getNextLevel()` returns a phase it also shows
  `SIGUIENTE FASE`.

### 5. Shared menu art (`src/game/art/MenuArt.ts`)

`menuBackdrop(scene)` is a procedural deep-space background used by MenuScene,
WorldSelectScene, GameOverScene, LevelCompleteScene. `SatenesArt` no longer
exports it and now renders only Satenes. `HealthHud` uses a generated `heart`
texture instead of the Satenes prop atlas; the result screen uses a generated
`clueIcon`.

### 6. Asset loading

`artManifest.ts` splits sources into `SHARED_ART_SOURCES` (Pedro, under
`assets/common/`), `SATENES_ART_SOURCES`, and `PINOS_ART_SOURCES` (currently
empty — Pinos is procedural). Every entry carries an explicit `path`; BootScene
loads `${BASE_URL}${source.path}` with no planet-specific rule and shows
"Preparando la aventura…". Pedro PNGs were physically moved to
`public/assets/common/`.

`prepareArt.ts` split into `preparePlayerArt`, `prepareSatenesArt`,
`preparePinosArt` (in `PinosArt.ts`), `preparePhysicsTextures`. No function
assumes a specific enemy.

### 7. Texture keys (`assetKeys.ts`)

Shared: `player`, `playerArt`, `platform`, `clue`, `particle`, `heart`,
`clueIcon`. Satenes: `satenesMonsterBody/Art`, `satenesProps/Terrain/Sky/Ridges`.
Pinos: `pinosPlushBody/Art`, `pinosProps/Terrain/Sky/Ridges`. Ownership is
obvious from the key; Pinos never references a Blue Monster texture.

## Pinos

### Enemy — Heavy Metal Plush (`src/game/entities/enemies/HeavyMetalPlush.ts`)

Its own mechanic, not a renamed Blue Monster. State machine:

| State | Behaviour |
| --- | --- |
| `patrol` | walks slowly between `patrolMinX`/`patrolMaxX` |
| `wind_up` | on detecting Pedro within `detectionRange` (same vertical band as the Blue Monster): face him, stop, ~380 ms crouch + rattle |
| `charge` | commit to a straight dash in the direction Pedro was in when the charge began (no continuous homing), `chargeSpeed` (faster than a Blue Monster), ≤ ~620 ms, clamped to `patrolMin/Max ± maxChargeOvershoot` (default 180) |
| `recover` | stop ~520 ms |
| `return` | walk back to the patrol interval, then `patrol` |

Contact uses the existing `Player.takeDamage`. No Pedro attacks. Defaults live
in the class; every value is overridable per enemy via `HeavyMetalPlushConfig`.

### Art (`src/game/art/PinosArt.ts`)

Procedural placeholders generated in `preparePinosArt`:

- `pinosSky` — teal-to-rust gradient with a dirty horizon haze and a dead moon
- `pinosRidges` — silhouette of crooked mechanical towers and antennas, tiled +
  mirrored as two parallax layers by the `PinosArt` scenery class
- `pinosTerrain` — brushed dark-steel tile used by `drawPinosTerrain` (tiled fill
  + bright top lip + a row of bolts, so platforms stay readable vs. background)
- `pinosPlushArt` — the patched plush/robot (teal fabric, rust patch, riveted
  chest plate, one X-stitch button eye, one glowing LED eye, bent antenna)

Helpers: `drawPinosTerrain`, `drawPinosDecoration` (bolt/cable/spring/toy/glow),
`drawPinosSpaceship`. None import from `SatenesArt`.

Replacement path: drop PNGs in `public/assets/pinos/`, add to
`PINOS_ART_SOURCES`, delete the matching generator block. `PinosScene` and
`HeavyMetalPlush` are unaffected.

### Level — Pinos Phase 1 (`pinosConfig.ts`)

World `10000 × 720`, void `y = 820`, ground top `y = 640` (identical to Satenes,
so `PLAYER_TUNING` is the exact layout constraint). Six ground segments, five
pits of 180–190 px (max flat jump range with default tuning ≈ 240 px), 17
elevated platforms with tops between `y = 396` and `y = 546` (≤ 151 px climb).

| Section | Range (px) | Content |
| --- | --- | --- |
| A introduction | 0–1400 | spaceship, spawn, no enemy |
| B first plush | 1580–3500 | one plush, wide safe area to observe it |
| C platforming | 3690–4310 | shelf of ledges + a pit |
| D enemy pressure | 4500–6200 | two plushes in separate patrol zones |
| E mixed | 6380–7820 | platforms + one plush + a pit |
| F final approach | 8010–9990 | tighter platforms + one plush, then a safe clue area at `x ≈ 9520` |

Target first-run time ≈ 2–4 minutes. Every plush patrol zone plus charge
overshoot is verified to stay over solid ground (tests).

## Verification

`npm run typecheck`, `npm test` (14 subtests across `art.test.mjs` +
`architecture.test.mjs`), `npm run build` all pass.

Architecture invariants covered by tests: registry has Satenes + Pinos, unique
world ids, unique level ids per world, non-empty scene keys, both Phase 1s
registered on the right scenes, `getNextLevel` behaviour, art sources are
planet-independent and carry explicit paths, both level configs valid (spawn /
clue in bounds, positive platform dimensions, no uncrossable pit), Pinos size
comparable to Satenes, plush charge zones over ground.

Manual flows A–E from the task brief (boot → menu → world select → phase →
death → Game Over → retry; clue → Level Complete → replay / back to worlds) all
hold: no shared scene restarts a hard-coded `SatenesScene`.

## Out of scope (unchanged)

No backend, save games, unlock persistence, audio, inventory, weapons, combat,
boss fights, dialogue, cutscenes, mobile controls, or auth.
