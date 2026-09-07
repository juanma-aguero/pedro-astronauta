/**
 * The single source of truth for which worlds and phases exist and which Phaser
 * scene runs each one. Menu navigation, world selection, and the result screens
 * all read this registry; none of them hard-code a world or scene name.
 *
 * To add a phase: append a `LevelDefinition` to the world's `levels`.
 * To add a world: append a `WorldDefinition`.
 * Also register the matching scene in `gameConfig.ts`.
 */

export interface LevelDefinition {
  id: string;
  displayName: string;
  sceneKey: string;
}

export interface WorldDefinition {
  id: string;
  displayName: string;
  description: string;
  levels: readonly LevelDefinition[];
}

export const WORLD_REGISTRY: readonly WorldDefinition[] = [
  {
    id: "satenes",
    displayName: "SATENES",
    description: "El planeta de los Blue Monsters",
    levels: [
      { id: "phase-1", displayName: "FASE 1", sceneKey: "SatenesScene" },
    ],
  },
  {
    id: "pinos",
    displayName: "PINOS",
    description: "El planeta de los Peluches Heavy Metal",
    levels: [
      { id: "phase-1", displayName: "FASE 1", sceneKey: "PinosScene" },
    ],
  },
  {
    id: "silencio",
    displayName: "SILENCIO",
    description: "Un mundo donde el ruido puede ser mortal",
    levels: [
      { id: "phase-1", displayName: "FASE 1", sceneKey: "SilencioScene" },
    ],
  },
];

export function getWorld(worldId: string): WorldDefinition | undefined {
  return WORLD_REGISTRY.find((world) => world.id === worldId);
}

export function getLevel(
  worldId: string,
  levelId: string,
): LevelDefinition | undefined {
  return getWorld(worldId)?.levels.find((level) => level.id === levelId);
}

/**
 * The next phase inside the same world, or `undefined` when the given phase is
 * the last one defined. Cross-world progression is intentionally not modelled
 * yet.
 */
export function getNextLevel(
  worldId: string,
  levelId: string,
): LevelDefinition | undefined {
  const world = getWorld(worldId);
  if (!world) return undefined;
  const index = world.levels.findIndex((level) => level.id === levelId);
  if (index < 0) return undefined;
  return world.levels[index + 1];
}
