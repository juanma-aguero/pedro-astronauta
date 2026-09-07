import { getLevel, WORLD_REGISTRY } from "./worldRegistry";

/**
 * What a running phase needs to know about itself so the shared result screens
 * (Game Over, Level Complete) can restart it or offer the next phase without any
 * hard-coded scene names.
 */
export interface LevelRunContext {
  worldId: string;
  levelId: string;
  sceneKey: string;
}

/** Builds a run context from registry data, or `undefined` if the ids are unknown. */
export function toRunContext(
  worldId: string,
  levelId: string,
): LevelRunContext | undefined {
  const level = getLevel(worldId, levelId);
  if (!level) return undefined;
  return { worldId, levelId, sceneKey: level.sceneKey };
}

/**
 * The very first phase in the registry. Used only as a defensive fallback by the
 * shared result screens when they are somehow started without a run context.
 */
export function firstRunContext(): LevelRunContext {
  const world = WORLD_REGISTRY[0];
  const level = world.levels[0];
  return { worldId: world.id, levelId: level.id, sceneKey: level.sceneKey };
}

/** Type guard for scene data received through `scene.start(key, data)`. */
export function isLevelRunContext(value: unknown): value is LevelRunContext {
  if (typeof value !== "object" || value === null) return false;
  const candidate = value as Record<string, unknown>;
  return (
    typeof candidate.worldId === "string" &&
    typeof candidate.levelId === "string" &&
    typeof candidate.sceneKey === "string"
  );
}
