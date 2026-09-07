# Pedro Astronauta: Playable MVP Master Plan

## Purpose

Build and validate the smallest complete version of **Pedro Astronauta**: a playable desktop-browser platformer in which Pedro crosses Satenes, avoids Blue Monsters, survives damage, and reaches a clue about his kidnapped family.

This plan covers only the first playable MVP. It deliberately avoids planning later planets or systems until the technical foundation and core gameplay loop have been tested.

The implementation specification is [001 - Playable Satenes MVP](./specs/001-playable-satenes-mvp.md).

## Product principles

Priorities, in order:

1. Deliver a complete and enjoyable playable loop.
2. Keep the code easy to understand and tune.
3. Separate reusable gameplay from Satenes-specific content.
4. Make placeholder artwork replaceable without changing gameplay logic.
5. Add abstractions only when the MVP needs them.

All code, file names, comments, and technical documentation must be in English. Every player-facing string must be in Spanish.

## MVP gameplay loop

1. The player opens the game and sees the title screen.
2. The player selects `JUGAR`.
3. Pedro starts beside his spaceship on Satenes.
4. The player moves right, jumps across platforms and pits, and avoids Blue Monsters.
5. Enemy contact removes health while a short invulnerability window prevents rapid repeated damage.
6. Losing all health opens the Game Over screen; falling into the void restarts the level.
7. Reaching the clue opens the completion screen.
8. The player can start Satenes again from either result screen.

## Delivery milestones

### Milestone 1: Running foundation

- Create a Vite, TypeScript, and Phaser 3 project using npm.
- Configure a responsive, aspect-preserving desktop canvas and Phaser Arcade Physics.
- Generate all placeholder textures at runtime with Phaser.
- Implement the title screen and transition into an empty Satenes scene.

**Exit condition:** `npm install`, `npm run dev`, and `npm run build` work, and `JUGAR` opens Satenes.

### Milestone 2: Traversal slice

- Implement Pedro's movement, jumping, gravity, and platform collisions.
- Build the complete Satenes layout from configuration data.
- Add world and camera bounds, camera following, pits, height variation, and the starting spaceship.
- Restart Satenes when Pedro falls below the configured void boundary.

**Exit condition:** the player can traverse the whole level from the spaceship to the clue location without enemies.

### Milestone 3: Hazard and survival loop

- Implement Blue Monster patrol, detection, chase, disengagement, and return behavior.
- Instantiate multiple monsters from Satenes configuration.
- Implement Pedro's three-point health, contact damage, one-second invulnerability, blinking feedback, and Game Over transition.
- Add the Spanish health HUD and restart action.

**Exit condition:** monsters can be avoided, contact damage behaves predictably, and death can be followed by a clean restart.

### Milestone 4: Completion and validation

- Add the clue and level-complete transition.
- Add the specified Spanish completion message and replay action.
- Tune movement, gaps, camera behavior, and enemy configuration for a first playthrough of approximately two to four minutes.
- Perform only the refactoring necessary to remove duplication or oversized scene logic discovered while building the vertical slice.

**Exit condition:** the complete MVP loop passes the acceptance criteria in the implementation specification.

## Architecture boundaries

- `Player` owns Pedro's movement and health behavior and contains no planet-specific knowledge.
- `BlueMonster` owns the behavior of that enemy type and depends on a target position, not on Pedro's internal implementation.
- `SatenesScene` assembles the level, collisions, camera, HUD, and scene transitions.
- `satenesConfig` is the editable source of truth for level geometry, placements, enemy tuning, and goal position.
- Shared asset keys and runtime placeholder generation isolate visual assets from gameplay classes.
- Menu, Game Over, and completion screens remain separate scenes rather than conditional branches inside the level.

These boundaries are sufficient for the MVP. Do not add a generic planet framework, dependency injection, event bus, save layer, component system, or generalized enemy hierarchy.

## Definition of done

The MVP is complete when:

- A clean checkout can be installed and run with the documented npm commands.
- The production TypeScript/Vite build completes without errors.
- The full loop can be played with both supported movement key sets and Space to jump.
- Pedro can land on platforms, fall into pits, receive damage, die, and restart.
- Every configured Blue Monster patrols, chases, disengages, returns, and damages Pedro on contact.
- The HUD, title, buttons, Game Over state, and completion state use the specified Spanish copy.
- The camera follows Pedro without leaving the level bounds, and resizing preserves a usable view.
- Reaching the clue displays the completion state and `VOLVER A JUGAR` resets the level.
- A first-time successful run is reasonably close to two to four minutes after tuning.
- No external artwork, audio, persistence, backend, mobile controls, or other excluded feature is present.

## Explicitly deferred

The following are outside this MVP: additional planets, planet selection, a world map, combat, weapons, NPCs, dialogue, inventory, saves, achievements, extra collectibles, audio, settings, mobile controls, procedural generation, multiplayer, backend services, accounts, sophisticated animation, and advanced visual effects.

Any request for one of these items should become a separate future specification after the MVP has been validated.
