# Pedro, el niño astronauta

A small 2D side-scrolling platformer for desktop browsers. Pedro, a 10-year-old
astronaut, crosses the planet Satenes, avoids Blue Monsters, and reaches a clue
about his kidnapped family.

This is the MVP described in
[`docs/specs/001-playable-satenes-mvp.md`](docs/specs/001-playable-satenes-mvp.md).

## Stack

TypeScript (strict) · Vite · Phaser 3 · Arcade Physics. No backend, no audio, no
persistence. Illustrated PNG assets are loaded once and prepared as Phaser
textures, with animated characters and layered parallax scenery.

## Requirements

- Node.js 20+ and npm.
- A current desktop version of Chrome, Firefox, or Safari.

## Scripts

```sh
npm install      # install dependencies
npm run dev      # start the Vite dev server
npm run build    # type-check and produce a production build in dist/
npm run preview  # serve the production build locally
npm run typecheck
npm test         # source asset integrity, framing, and collision invariants
```

## Controls

| Action | Keys |
| --- | --- |
| Move left | `A` or `←` |
| Move right | `D` or `→` |
| Jump | `Space` |

There is no double jump, sprint, crouch, or attack.

## How to play

1. On the title screen, click **JUGAR**.
2. Move right from the spaceship toward the clue, crossing platforms and pits.
3. Avoid Blue Monsters. Contact costs one of three health points, with a
   one-second grace period between hits (Pedro blinks while invulnerable).
4. Losing all health shows **GAME OVER** (`REINTENTAR` restarts). Falling into a
   pit restarts the level immediately.
5. Reaching the clue shows the completion screen (`VOLVER A JUGAR` restarts).

## Where to tune the game

| Behavior | Source of truth |
| --- | --- |
| Movement speed, jump velocity, health, grace period | `src/game/config/gameplayTuning.ts` |
| Gravity, renderer, scaling | `src/game/config/gameConfig.ts` |
| Satenes geometry, platforms, enemies, decorations, clue | `src/game/planets/satenes/satenesConfig.ts` |
| Physics and artwork texture keys | `src/game/config/assetKeys.ts` |
| Asset sources, atlas crops, animation framing | `src/game/config/artManifest.ts` |

Character artwork is separate from physics bodies, so changing an illustration
does not change collision dimensions. See [the art guide](docs/ART_DIRECTION.md)
for asset preparation, generation prompts, and visual verification notes.

## Project layout

```text
src/
  main.ts                       Phaser game bootstrap
  game/
    config/                     asset keys, game config, gameplay tuning
    art/                        texture preparation, terrain, parallax scenery
    entities/
      Player.ts                 movement, jump, health, damage gating, blinking
      enemies/BlueMonster.ts     patrol / chase / return state machine
    planets/satenes/            SatenesScene + satenesConfig (level data)
    scenes/                     BootScene, MenuScene, GameOverScene, LevelCompleteScene
    ui/createTextButton.ts      shared button helper
```
