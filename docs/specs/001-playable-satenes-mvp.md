# Specification 001: Playable Satenes MVP

## Status

Ready for implementation.

## Objective

Implement a small, complete 2D side-scrolling platformer for desktop browsers using TypeScript, Vite, Phaser 3, and Phaser Arcade Physics.

The player controls Pedro, a 10-year-old astronaut searching for his kidnapped family. This first version contains one planet, Satenes, and one enemy type, the Blue Monster. It validates project setup, movement, level construction, enemy behavior, damage, death, restart, and level completion.

## Success criteria

The implementation is successful when a player can:

1. Open the title screen and select `JUGAR`.
2. Move Pedro with A/D or the arrow keys and jump with Space.
3. Traverse a scrolling level using ground and elevated platforms.
4. Avoid Blue Monsters or take correctly throttled contact damage.
5. Lose all health, see Game Over, and restart.
6. Fall into a pit and restart the level.
7. Reach the clue, read the completion message, and play again.

The first successful playthrough should take approximately two to four minutes for a new player. This is a tuning target, not a timer or enforced gameplay rule.

## Technical baseline

- Package manager: npm.
- Runtime: current desktop versions of Chromium, Firefox, and Safari.
- Language: TypeScript with strict type checking enabled.
- Build tool: Vite.
- Game framework: Phaser 3.
- Physics: Phaser Arcade Physics.
- Rendering: Phaser Canvas/WebGL automatic selection.
- UI: Phaser game objects only; do not add React or another UI framework.
- Assets: runtime-generated Phaser textures and shapes only.
- Persistence, backend, authentication, and audio: none.

Required scripts:

```json
{
  "dev": "vite",
  "build": "tsc -b && vite build",
  "preview": "vite preview",
  "typecheck": "tsc -b --pretty false"
}
```

Install the current stable compatible releases at implementation time and commit the generated `package-lock.json`. Do not depend on prerelease packages.

## Project structure

Use the following structure as the target. Small helper types may remain beside their only consumer instead of receiving their own directories.

```text
src/
  main.ts
  game/
    config/
      assetKeys.ts
      gameConfig.ts
      gameplayTuning.ts
    entities/
      Player.ts
      enemies/
        BlueMonster.ts
    planets/
      satenes/
        SatenesScene.ts
        satenesConfig.ts
    scenes/
      BootScene.ts
      MenuScene.ts
      GameOverScene.ts
      LevelCompleteScene.ts
    ui/
      createTextButton.ts
```

Responsibilities:

- `main.ts` creates the Phaser game.
- `gameConfig.ts` defines renderer, scaling, physics, and scene registration.
- `gameplayTuning.ts` contains Pedro's shared movement and health defaults.
- `assetKeys.ts` exports stable keys for generated placeholders.
- `BootScene` generates placeholder textures once and opens the menu.
- `MenuScene`, `GameOverScene`, and `LevelCompleteScene` render their respective Spanish screens and actions.
- `Player` owns input-driven movement, jumping, health, damage gating, and blinking.
- `BlueMonster` owns its state and horizontal movement.
- `satenesConfig.ts` contains all Satenes-specific placement and enemy data.
- `SatenesScene` creates the configured level and coordinates collisions, HUD, camera, and scene flow.

Do not introduce base scene classes, base enemy classes, a service layer, a global event bus, or a generic planet registry for this version.

## Game configuration

Use a logical game size of 1280 × 720 pixels.

- Phaser scale mode: `Phaser.Scale.FIT`.
- Auto-center: `Phaser.Scale.CENTER_BOTH`.
- Background color: a dark space color such as `#090b1a`.
- Arcade gravity: `{ y: 1400 }`.
- Arcade debug rendering: disabled.
- The canvas must preserve its aspect ratio when the browser window changes size.
- No mobile-specific layout or touch input is required.

## Scene flow

```text
BootScene -> MenuScene -> SatenesScene
                           |          |
                           v          v
                    GameOverScene  LevelCompleteScene
                           |          |
                           +-----> SatenesScene
```

Only `BootScene` and `MenuScene` start during initial load. Result scenes must stop Satenes before they display. Starting or replaying Satenes creates a fresh scene and therefore restores health, enemies, and the clue automatically.

### Menu screen

Display:

```text
PEDRO
EL NIÑO ASTRONAUTA
JUGAR
```

`JUGAR` must be a clearly button-like Phaser object and respond to pointer interaction. Selecting it starts `SatenesScene`.

### Game Over screen

Display:

```text
GAME OVER
REINTENTAR
```

`REINTENTAR` starts a fresh `SatenesScene`.

### Completion screen

Display exactly:

```text
¡Encontraste una pista!
Pedro está un paso más cerca de encontrar a su familia.
VOLVER A JUGAR
```

`VOLVER A JUGAR` starts a fresh `SatenesScene`. Do not add a next-planet action.

Buttons should have normal and hover colors and a large enough pointer target for desktop use. A shared `createTextButton` helper is sufficient; do not build a generalized UI framework.

## Placeholder visuals

Create textures in `BootScene` with `Phaser.GameObjects.Graphics.generateTexture`. Keep their keys in `assetKeys.ts`; entities and scenes must use keys rather than drawing their own character textures.

Required keys and visual intent:

| Key | Placeholder |
| --- | --- |
| `player-placeholder` | Orange astronaut body with a light visor, approximately 42 × 58 pixels |
| `blue-monster-placeholder` | Clearly blue creature with contrasting eyes, approximately 48 × 42 pixels |
| `spaceship-placeholder` | Gray and red simplified rocket, approximately 120 × 150 pixels |
| `clue-placeholder` | Gold marker, approximately 48 × 48 pixels |
| `platform-placeholder` | Brown or purple terrain tile suitable for scaling |

Add a small `Pedro` label above the player and a `?` above or inside the clue if visual identification is otherwise unclear. These labels are player-facing and therefore use the Spanish/proper-name copy shown here.

Background stars, hills, craters, or colored atmospheric shapes may be created directly by `SatenesScene` as non-interactive decoration. Keep them simple and do not download or add image files.

Replacing a generated texture later with an image loaded under the same key must not require changes to `Player`, `BlueMonster`, or collision logic.

## Shared gameplay tuning

Define these initial values in `gameplayTuning.ts`:

```ts
export const PLAYER_TUNING = {
  moveSpeed: 260,
  jumpVelocity: -650,
  maxHealth: 3,
  invulnerabilityMs: 1000,
} as const;
```

These are starting values. Adjust them during the final tuning milestone if manual playtesting shows that the specified layout is frustrating or cannot meet the intended traversal time.

## Player

`Player` should extend `Phaser.Physics.Arcade.Sprite` and expose only what the scene needs to coordinate gameplay.

Suggested public interface:

```ts
export class Player extends Phaser.Physics.Arcade.Sprite {
  readonly maxHealth: number;

  constructor(scene: Phaser.Scene, x: number, y: number);
  update(time: number): void;
  takeDamage(time: number): boolean;
  getHealth(): number;
  isDead(): boolean;
}
```

Behavior:

- A or Left Arrow sets horizontal velocity to `-moveSpeed`.
- D or Right Arrow sets horizontal velocity to `moveSpeed`.
- When neither direction is held, horizontal velocity becomes zero.
- If both directions are held, horizontal velocity becomes zero.
- Space initiates a jump only on a new key press while the Arcade body is touching or blocked by a platform.
- Holding Space must not trigger repeated jumps.
- There is no double jump, coyote time, jump buffering, sprint, crouch, attack, or variable jump height in this MVP.
- The player begins with `maxHealth` health.
- `takeDamage` returns `true` only when damage was applied. It removes one health point unless Pedro is dead or within the invulnerability window.
- Successful nonlethal damage starts invulnerability for `invulnerabilityMs`.
- During invulnerability, blink by alternating alpha between a visible and faded value. Restore alpha to `1` when it ends.
- Health must never be negative.
- When health reaches zero, disable player-controlled movement and allow `SatenesScene` to transition to Game Over.

Use `setCollideWorldBounds(true)` for the left and right world edges. Do not use world-bound collision to prevent the player from falling through pits.

## Blue Monster

`BlueMonster` must be a separate `Phaser.Physics.Arcade.Sprite` class. It receives its behavior configuration and a target-position callback; it must not read Pedro's input, health, or class internals.

```ts
export interface BlueMonsterConfig {
  x: number;
  y: number;
  patrolMinX: number;
  patrolMaxX: number;
  detectionRange: number;
  disengageRange: number;
  maxRoamDistance: number;
  patrolSpeed: number;
  chaseSpeed: number;
}

type TargetPositionProvider = () => Readonly<{ x: number; y: number }>;
```

Use three internal states: `patrol`, `chase`, and `return`.

- **Patrol:** move horizontally between `patrolMinX` and `patrolMaxX`, reversing direction at each boundary.
- **Chase:** enter when the target is within `detectionRange` using straight-line distance. Move horizontally toward the target at `chaseSpeed`.
- **Disengage:** leave chase when the target exceeds `disengageRange` or pursuing farther would exceed the configured roam limits.
- **Return:** move at `patrolSpeed` toward the nearest point inside the patrol interval. Resume patrol when within 8 pixels of that interval.
- The allowed roam interval is `patrolMinX - maxRoamDistance` through `patrolMaxX + maxRoamDistance`. Clamp horizontal chase movement to this interval.
- A target entering detection range during return immediately restores chase.
- Set the sprite's horizontal flip from movement direction.

Blue Monsters use gravity and collide with platforms. Each configured patrol and roam interval must remain over safe ground so monsters do not require ledge-detection logic in this MVP.

Use overlap between Pedro and the monster group for damage. Pedro cannot damage, disable, or kill a Blue Monster.

## Level configuration contract

Define Satenes as data with typed configuration. The scene may derive Phaser objects from this data but must not duplicate coordinates in scene logic.

```ts
interface Position {
  x: number;
  y: number;
}

interface PlatformConfig extends Position {
  width: number;
  height: number;
}

interface DecorationConfig extends Position {
  kind: "star" | "rock" | "crater";
  scale?: number;
}

interface PlanetLevelConfig {
  name: string;
  world: { width: number; height: number; voidY: number };
  playerSpawn: Position;
  spaceship: Position;
  platforms: readonly PlatformConfig[];
  decorations: readonly DecorationConfig[];
  enemies: readonly BlueMonsterConfig[];
  clue: Position;
}
```

For every `PlatformConfig`, `x` and `y` represent the center of the rectangle. Use static Arcade bodies and refresh each body after applying its configured display size.

## Satenes layout

Use a world size of 10000 × 720 and a void boundary of `y = 820`. Ground surfaces are at `y = 680` with a height of 80, leaving their walkable top at `y = 640`.

Core positions:

```ts
playerSpawn: { x: 220, y: 580 }
spaceship: { x: 110, y: 560 }
clue: { x: 9720, y: 580 }
```

Ground segments:

| Center X | Center Y | Width | Height | Resulting range |
| ---: | ---: | ---: | ---: | --- |
| 800 | 680 | 1600 | 80 | 0–1600 |
| 2480 | 680 | 1440 | 80 | 1760–3200 |
| 4095 | 680 | 1410 | 80 | 3390–4800 |
| 5740 | 680 | 1520 | 80 | 4980–6500 |
| 7400 | 680 | 1400 | 80 | 6700–8100 |
| 9145 | 680 | 1710 | 80 | 8290–10000 |

These create five pits between 160 and 200 pixels wide. Validate every pit with the default movement tuning.

Elevated platforms:

| Center X | Center Y | Width | Height |
| ---: | ---: | ---: | ---: |
| 700 | 530 | 260 | 30 |
| 1180 | 455 | 220 | 30 |
| 1980 | 520 | 240 | 30 |
| 2550 | 430 | 300 | 30 |
| 2980 | 520 | 180 | 30 |
| 3600 | 500 | 260 | 30 |
| 4150 | 405 | 240 | 30 |
| 4580 | 520 | 220 | 30 |
| 5250 | 485 | 280 | 30 |
| 5850 | 390 | 260 | 30 |
| 6350 | 500 | 220 | 30 |
| 6950 | 500 | 240 | 30 |
| 7480 | 410 | 300 | 30 |
| 7950 | 520 | 180 | 30 |
| 8500 | 480 | 260 | 30 |
| 9050 | 395 | 280 | 30 |
| 9500 | 500 | 240 | 30 |

These platforms provide optional safer routes and height variation. Do not require pixel-perfect jumps or hide the clue.

Configure seven Blue Monsters on ground segments:

| X | Y | Patrol Min X | Patrol Max X | Detection | Disengage | Max Roam | Patrol Speed | Chase Speed |
| ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| 1100 | 590 | 900 | 1300 | 320 | 520 | 80 | 75 | 125 |
| 2300 | 590 | 2050 | 2600 | 340 | 540 | 80 | 80 | 135 |
| 2900 | 590 | 2750 | 3050 | 300 | 500 | 60 | 70 | 125 |
| 3900 | 590 | 3650 | 4400 | 350 | 560 | 90 | 85 | 140 |
| 5550 | 590 | 5250 | 6000 | 360 | 580 | 100 | 85 | 145 |
| 7200 | 590 | 6900 | 7700 | 370 | 600 | 100 | 90 | 150 |
| 8800 | 590 | 8500 | 9300 | 380 | 620 | 110 | 95 | 155 |

If a generated monster's body height differs slightly from the placeholder dimensions, adjust its configured `y` only enough to make it rest correctly on the ground. Keep all other level coordinates in configuration.

Add lightweight configured decorations across the level to establish a distinct purple/blue alien-planet atmosphere. Decorations have no physics or gameplay effect.

## Satenes scene behavior

On creation, `SatenesScene` must:

1. Read `satenesConfig` and set physics/world bounds.
2. Draw the background and configured decorations.
3. Create static platforms from configuration.
4. Create the spaceship and clue placeholders.
5. Create Pedro at the configured spawn.
6. Create every Blue Monster from its configuration.
7. Register player/platform and monster/platform colliders.
8. Register player/monster and player/clue overlaps.
9. Create a screen-fixed HUD showing `Vida: 3` initially.
10. Configure the camera to follow Pedro and remain inside the world bounds.

In each update:

- Update Pedro once with the current Phaser time.
- Update every Blue Monster once.
- If Pedro's `y` exceeds `voidY`, restart `SatenesScene` immediately with full state.

When player/monster overlap applies damage:

- Refresh the HUD to `Vida: N`.
- Ignore overlaps while damage is blocked by invulnerability.
- If health reaches zero, prevent duplicate transitions and start `GameOverScene`.

When player/clue overlap occurs:

- Prevent duplicate transitions.
- Stop gameplay input and start `LevelCompleteScene`.

The camera should use a small horizontal lead or neutral centered follow, whichever is simpler and remains comfortable during manual playtesting. Do not add camera shake or cinematic effects.

## Failure and reset behavior

- Falling below the void boundary restarts Satenes immediately. It does not display Game Over or remove a health point.
- Health reaching zero displays Game Over.
- Restarting from a pit, Game Over, or completion restores three health points, all enemy states, the clue, and Pedro's spawn position.
- No progress is saved between runs or browser sessions.
- Guard all scene transitions so one physics frame cannot trigger them more than once.

## Configuration guide

After implementation, tune the requested behavior in these locations:

| Behavior | Source of truth |
| --- | --- |
| Pedro's movement speed | `PLAYER_TUNING.moveSpeed` |
| Pedro's jump behavior | `PLAYER_TUNING.jumpVelocity` and Arcade gravity in `gameConfig.ts` |
| Pedro's health | `PLAYER_TUNING.maxHealth` |
| Damage grace period | `PLAYER_TUNING.invulnerabilityMs` |
| Complete Satenes layout | `satenesConfig.platforms` |
| Platform positions and sizes | Individual entries in `satenesConfig.platforms` |
| Enemy positions | `satenesConfig.enemies[].x` and `.y` |
| Detection range | `satenesConfig.enemies[].detectionRange` |
| Monster movement speed | `.patrolSpeed` and `.chaseSpeed` |
| Patrol behavior area | `.patrolMinX`, `.patrolMaxX`, and `.maxRoamDistance` |

Do not make gameplay tuning depend on generated texture dimensions beyond initial body sizing.

## Verification plan

### Automated checks

Run from a clean dependency installation:

```sh
npm install
npm run typecheck
npm run build
```

No dedicated test framework is required for this MVP. Prefer TypeScript checks, a production build, and focused manual gameplay verification over adding test infrastructure that cannot meaningfully simulate Phaser gameplay.

### Manual acceptance scenarios

1. **Startup:** the title screen renders the three required Spanish strings and `JUGAR` starts Satenes.
2. **Controls:** A/Left moves left, D/Right moves right, Space jumps, and no excluded movement ability is available.
3. **Physics:** Pedro falls, lands reliably, cannot pass through platforms, and crosses every required gap with default tuning.
4. **Camera:** the camera follows Pedro smoothly, respects both world edges, and the HUD remains fixed to the viewport.
5. **Resize:** changing the desktop browser window size preserves the 16:9 game view without breaking input or scene layout.
6. **Patrol:** each monster remains within its configured patrol area when Pedro is distant.
7. **Chase and return:** entering detection range begins pursuit; escaping beyond disengage/roam limits makes the monster return and resume patrol.
8. **Damage:** one overlap removes exactly one health point, updates `Vida: N`, and starts visible blinking.
9. **Invulnerability:** continuous or repeated overlap during the next 1000 ms causes no additional damage; damage works again afterward.
10. **Death:** the third valid hit opens Game Over once, and `REINTENTAR` restores a fresh level with three health points.
11. **Pit:** falling below the world restarts Satenes with full health and reset monsters.
12. **Completion:** touching the clue opens the exact completion copy once, and `VOLVER A JUGAR` starts a fresh run.
13. **Duration:** a first-time successful run is approximately two to four minutes; adjust only configuration and tuning values if it is substantially outside that target.
14. **Scope audit:** there is no external artwork, audio, local storage, backend, authentication, combat, extra planet, mobile control, or unrequested system.

## Support for another planet

A future planet would add its own scene and configuration containing world geometry, placements, decoration, enemies, and goal. It would reuse `Player`, shared gameplay tuning, asset keys, menu/result UI where applicable, and any enemy types it shares with Satenes.

Adding that planet must not require changes to Pedro's internal implementation. Do not build the planet selector, shared planet registry, or second-planet abstractions until a future specification requires them.
