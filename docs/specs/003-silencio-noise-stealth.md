# Specification 003: Silencio — the noise / stealth world

## Status

Implemented.

## Objective

Add the third world, **Silencio**, home of the **Oscuros**, built on the
multi-world architecture established by specs 001–002. Silencio introduces one
new, self-contained mechanic — **sound** — through composition only. Satenes and
Pinos are unchanged (byte-for-byte apart from shared, inert additions to
`Player` and `artManifest`).

Scope: `Silencio / Phase 1` only. No audio, no combat, no lighting engine, no
persistence (see spec §33).

## Gameplay goal

The rule of the planet is **"NO HAGAS RUIDO."** The Oscuros are blind; they hunt
by sound. Pedro learns that:

- moving normally makes footstep noise on a cadence;
- jumping makes noise once; **landing makes the most noise**;
- an environmental scrap pile makes a very loud noise if touched;
- holding **SHIFT** walks at ~45 % speed and is almost silent;
- staying still is safe — an Oscuro that heard something will investigate the
  *location of the sound*, search, and eventually give up.

## Architecture integration (no new abstractions)

Silencio reuses, unchanged: `WORLD_REGISTRY` / `getLevel` / `getNextLevel`,
`LevelRunContext` + `toRunContext` + `firstRunContext`, `BasePlanetLevelConfig`,
`Player`, `HealthHud`, `createTextButton`, `MenuArt`, `GameOverScene`,
`LevelCompleteScene`, the `<WORLD>_ART_SOURCES` + `prepare<World>Art` +
`scene.textures.exists` placeholder pattern, and the namespaced `ASSET_KEYS`
convention (`silencioOscuroBody`, `silencioOscuroArt`, `silencioSky`, …).

New registry entry only:

```ts
{ id: "silencio", displayName: "SILENCIO",
  description: "Un mundo donde el ruido puede ser mortal",
  levels: [{ id: "phase-1", displayName: "FASE 1", sceneKey: "SilencioScene" }] }
```

`WorldSelectScene` now renders three cards from the registry with no
special-casing; its card row sizes itself to the world count.

## NoiseSystem

`src/game/mechanics/noise/` — deliberately outside `planets/` and Phaser-free so
it is unit-testable.

- `noiseTypes.ts` — `NoiseKind = "footstep" | "jump" | "landing" | "environment"`,
  `NoiseEvent { x, y, kind, intensity (0..1), radius (px), timestamp }`,
  `NoiseListener { onNoise(e) }`, and `isWithinEarshot(x, y, e, mult?)`.
- `NoiseSystem.ts`:
  - `addListener` / `removeListener`
  - `emit(input, now)` → stamps `timestamp`, pushes to a short recent list,
    raises the meter to `max(meter, intensity)`, calls every listener
    synchronously, returns the event.
  - `update(now, deltaMs)` → decays the meter to 0 over `METER_DECAY_MS` (1100 ms)
    and prunes events older than `EVENT_RETENTION_MS` (4000 ms).
  - `getMeter()` (HUD), `getLastEvent()`, `getRecentEvents()`, `reset()`.

It is a plain object created per `SilencioScene.create()` and discarded on
restart, so there is no stale state.

### Noise values (SilencioScene constants — tuning targets)

| Source | intensity | radius | cadence |
| --- | ---: | ---: | --- |
| slow-walk footstep | 0.15 | 105 | every 560 ms |
| normal footstep | 0.45 | 290 | every 340 ms |
| jump takeoff | 0.55 | 350 | once per jump |
| landing | 0.85 | 540 | once per landing |
| environmental (noise trap) | 1.0 | 720 | once per touch, ≥ 1400 ms cooldown |

Footsteps are emitted only while `player.isGrounded()` and `|body.velocity.x| > 5`.
Noise emitted in the first `NOISE_GRACE_MS` (700 ms) after (re)start is ignored,
so the spawn drop does not ring the alarm.

### Visual feedback (no audio)

`SilencioScene.spawnPulse()` draws a translucent ring (`silencioNoiseRing`
texture) that expands to roughly the hearing radius and fades in ~400–650 ms.
Slow-walk emits a barely-visible dot; louder events emit larger/brighter rings;
the noise trap emits a big amber burst. An Oscuro also spawns a small cyan ring
on itself the moment it hears something.

## Slow walk — how it avoids coupling Player to Silencio

`Player` gained two **generic** capabilities, both inert unless used:

1. `setSpeedMultiplier(m)` / `getSpeedMultiplier()` — scales horizontal move
   speed only (not jump). Default `1`. `SilencioScene.update()` calls
   `player.setSpeedMultiplier(shiftDown ? 0.45 : 1)`. Any future world could use
   it for a sprint or mud.
2. `PLAYER_EVENTS.jump` / `PLAYER_EVENTS.land` — Pedro emits these on himself
   (he is an EventEmitter) at the exact frame a jump starts and the exact
   grounded-transition frame (the same check already used for the landing dust).
   `isGrounded()` was also exposed.

`SilencioScene` listens for `jump`/`land` and derives footsteps from
`isGrounded()` + velocity + its own cadence timer. `Player` has no `if (planet
=== ...)`, no noise import, and no knowledge that Silencio exists.

## Oscuro state machine

`src/game/entities/enemies/Oscuro.ts` — `implements NoiseListener`.

```
dormant ──hears quiet/med──▶ investigate ──arrives──▶ search ──timeout──▶ return ──home──▶ dormant
   │                              ▲  │                    │
   └──hears loud / close-range────┘  └──hears loud────────┘
                     ▼
                   hunt ──huntUntil elapsed──▶ investigate | search
```

- **dormant** — drifts slowly inside `[homeMinX, homeMaxX]`, "listening".
- **onNoise(e)** — if `isWithinEarshot(this, e, hearingMultiplier)`:
  set `targetX = e.x` (the *sound's* position, never Pedro's), flash alert.
  `intensity ≥ 0.8` → **hunt** (`huntUntil = now + 2500`); otherwise → **investigate**
  (only from dormant/return/search). A new event during hunt just updates `targetX`.
- **investigate** — walk to `targetX` at `investigateSpeed`; on arrival → search.
- **hunt** — walk to `targetX` at `huntSpeed` (fast); when `huntUntil` passes,
  drop to search (if arrived) or investigate.
- **search** — pause and sweep a short arc for `searchDurationMs`
  (1.5–3 s, dangerous); a new noise pulls it back to investigate/hunt.
- **return** — walk to home centre at `returnSpeed`; inside home → dormant.
- **close-range safety** (spec §12) — every frame, if Pedro is within
  `closeAwarenessRange` (70–100 px) *and* within 120 px vertically, force hunt
  toward Pedro. This is the only non-audio detection; it just stops Pedro walking
  through an Oscuro while silent.
- Movement is clamped to `[homeMinX - maxChaseDistance, homeMaxX + maxChaseDistance]`
  (default 340) so an Oscuro chasing a distant landing never walks into a pit —
  verified per enemy by `tests/architecture.test.mjs`.
- Contact damage uses the shared `Player.takeDamage` / invulnerability / GameOver
  flow (spec §14).

`OscuroConfig`: `x, y, homeMinX, homeMaxX, investigateSpeed, huntSpeed,
closeAwarenessRange, searchDurationMs`, optional `hearingMultiplier`,
`returnSpeed`, `maxChaseDistance`.

## Noise traps

`src/game/mechanics/noise/NoiseTrap.ts` — a static Arcade image (invisible body)
plus a drawn scrap-plate visual with a warning glint. `trigger(now)` emits one
`environment` `NoiseEvent` through the `NoiseSystem`, plays a shake + amber ring,
and sets a cooldown; it never touches Pedro's health. `NoiseTrapConfig`:
`x, y, width, height`, optional `intensity` (1), `radius` (720), `cooldownMs`
(1200).

## Level structure — Silencio Phase 1

World `10000 × 720`, void `y = 820`, ground top `y = 640` (shared convention).
Six ground segments, five gentle pits of 150–160 px, **14** elevated platforms
(tops `y = 426…526`). Deliberately fewer technical jumps than Satenes.

| Section | Range (px) | Content |
| --- | --- | --- |
| A — arrival | 0–1600 | spaceship, spawn, no Oscuro; the two on-screen hints, fading after ~5 s |
| B — first listener | 1760–4340 | one Oscuro in the open; a normal footstep draws it — the tutorial encounter, with room to retreat |
| C — quiet passage | 4500–5800 | an Oscuro mid-path; a SHIFT walk slips past |
| D — jump decision | 5950–7350 | three platforms above a ground-patrolling Oscuro — jump the route or time the patrol; landing is loud |
| E — noise trap | 7500–8700 | a scrap plate on the ground (jump it / take the two platforms) + an Oscuro that the trap lures |
| F — final approach | 8850–9990 | two Oscuros with overlapping territories, then a safe clue area at `x ≈ 9820` |

Six Oscuros total. One noise trap (`x = 8000`).

## HUD

`src/game/ui/NoiseHud.ts` — a 10-segment **RUIDO** bar under the `HealthHud`,
green→amber→red as it fills, driven by `NoiseSystem.getMeter()` each frame (rises
instantly, decays in ~1.1 s). No numbers. Silencio shows **VIDA** and **RUIDO**;
Satenes/Pinos still show only **VIDA**.

## Art

`src/game/art/SilencioArt.ts`, procedural placeholders in `prepareSilencioArt`
guarded by `scene.textures.exists`:

- `silencioSky` — near-black → navy → dusk gradient, cold haloed moon, dim stars
- `silencioRidges` — jagged black spire silhouettes, two parallax layers
- `silencioTerrain` — dark stone tile (tiled fill) with a faint cyan top edge so
  platforms stay readable against the near-black background
- `silencioOscuroArt` — a hunched shadow with a wispy skirt, a faint cyan rim
  light and two low glowing eyes (readability over realism)
- `silencioNoiseRing` — a plain ring used for all noise pulses

Plus a `SilencioArt` scenery class (sky, parallax spires, slow drifting fog
banks, faint motes, `update(scrollX)`), `drawSilencioTerrain`,
`drawSilencioDecoration` (`spire | glowplant | rock | fog`), and
`drawSilencioSpaceship`. Darkness is entirely art-side — the camera and gameplay
readability are untouched (spec §27).

## Extension points

- **Silencio Phase 2** — see the step list below / README.
- **Another noise source** — implement `NoiseListener` (or call `noiseSystem.emit`)
  and register it in the scene. Nothing else changes.
- **Another world with its own mechanic** — follow the Silencio shape: a
  `src/game/mechanics/<name>/` module + scene composition, never edits to
  `Player` or the shared scenes. If `Player` genuinely needs to expose more, add
  a *generic* capability (like `setSpeedMultiplier`), not a planet check.
- **Final art** — drop PNGs in `public/assets/silencio/`, add entries to
  `SILENCIO_ART_SOURCES`, delete the matching generator blocks.

## Adding Silencio Phase 2

1. Create `src/game/planets/silencio/SilencioPhase2Scene.ts` +
   `silencioPhase2Config.ts` (`SilencioLevelConfig` or a new
   `... extends BasePlanetLevelConfig`). Give the scene its own
   `const RUN_CONTEXT = { worldId: "silencio", levelId: "phase-2", sceneKey: "SilencioPhase2Scene" }`
   and reuse `NoiseSystem`, `Oscuro`, `NoiseTrap`, `NoiseHud`, `SilencioArt`.
2. Register `SilencioPhase2Scene` in the `scene: [...]` array of
   `src/game/config/gameConfig.ts`.
3. Append to the Silencio `levels` array in `worldRegistry.ts`:
   `{ id: "phase-2", displayName: "FASE 2", sceneKey: "SilencioPhase2Scene" }`.

`WorldSelectScene` shows the extra button; `LevelCompleteScene` shows
**SIGUIENTE FASE** after Phase 1. No shared-scene or navigation edits.

## Verification

`npm run typecheck`, `npm test` (28 subtests: `art` + `architecture` + `noise`),
`npm run build` all pass. Manual flows A–H from the task brief reasoned through:
world select shows all three worlds; slow walk keeps the meter low and Oscuros
calm; normal movement/jump/landing ring the meter and make Oscuros
investigate-then-search-then-return; the noise trap fires once per touch with a
cooldown; death → GameOver → REINTENTAR restarts Silencio; clue → LevelComplete →
REJUGAR FASE / VOLVER A MUNDOS; Satenes and Pinos play exactly as before.
