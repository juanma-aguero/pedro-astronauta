/**
 * Concepts shared by every planet level. Planet-specific data (enemies,
 * decorations, atmosphere) is declared in each planet's own config and must not
 * leak into these types.
 */

export interface Position {
  x: number;
  y: number;
}

export interface PlatformConfig extends Position {
  /** `x` and `y` are the center of the rectangle. */
  width: number;
  height: number;
}

export interface BasePlanetLevelConfig {
  world: {
    width: number;
    height: number;
    /** Pedro falling past this `y` restarts the current phase. */
    voidY: number;
  };

  playerSpawn: Position;
  spaceship: Position;
  platforms: readonly PlatformConfig[];
  clue: Position;
}
