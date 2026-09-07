import type { HeavyMetalPlushConfig } from "../../entities/enemies/HeavyMetalPlush";
import type { BasePlanetLevelConfig, PlatformConfig, Position } from "../planetTypes";

export interface PinosDecorationConfig extends Position {
  kind: "bolt" | "cable" | "spring" | "toy" | "glow";
  scale?: number;
}

export interface PinosLevelConfig extends BasePlanetLevelConfig {
  decorations: readonly PinosDecorationConfig[];
  enemies: readonly HeavyMetalPlushConfig[];
}

const GROUND_Y = 680;
const GROUND_HEIGHT = 80;

/**
 * Ground segments: [centerX, width]. Five pits of 180-190 px sit between them,
 * all crossable with the default jump tuning (max flat range ~240 px).
 *
 * A: 0-1400        introduction, spaceship, no enemies
 * B: 1580-3500     large safe area, first Heavy Metal Plush to observe
 * C: 3690-4310     platforming shelf
 * D: 4500-6200     two plushes in separate patrol zones
 * E: 6380-7820     mixed platforming + one plush + a pit
 * F: 8010-9990     harder approach, then a safe clue area
 */
const GROUND_SEGMENTS: readonly [number, number][] = [
  [700, 1400],
  [2540, 1920],
  [4000, 620],
  [5350, 1700],
  [7100, 1440],
  [9000, 1980],
];

const GROUND_PLATFORMS: readonly PlatformConfig[] = GROUND_SEGMENTS.map(
  ([x, width]) => ({ x, y: GROUND_Y, width, height: GROUND_HEIGHT }),
);

/** ~16 elevated platforms. Tops sit between y=396 and y=546 (<= 151 px climb). */
const ELEVATED_PLATFORMS: readonly PlatformConfig[] = [
  // Section A.
  { x: 520, y: 545, width: 220, height: 28 },
  { x: 950, y: 470, width: 200, height: 28 },
  // Section B.
  { x: 1850, y: 520, width: 240, height: 28 },
  { x: 2500, y: 440, width: 280, height: 28 },
  { x: 3060, y: 520, width: 200, height: 28 },
  // Section C.
  { x: 3520, y: 520, width: 170, height: 28 },
  { x: 3780, y: 430, width: 170, height: 28 },
  { x: 4300, y: 430, width: 160, height: 28 },
  // Section D.
  { x: 4950, y: 500, width: 240, height: 28 },
  { x: 5600, y: 470, width: 220, height: 28 },
  { x: 6050, y: 520, width: 200, height: 28 },
  // Section E.
  { x: 6560, y: 490, width: 200, height: 28 },
  { x: 6920, y: 410, width: 200, height: 28 },
  { x: 7600, y: 440, width: 190, height: 28 },
  // Section F.
  { x: 8220, y: 500, width: 190, height: 28 },
  { x: 8520, y: 410, width: 180, height: 28 },
  { x: 8820, y: 470, width: 190, height: 28 },
];

const ENEMIES: readonly HeavyMetalPlushConfig[] = [
  // B: alone in a wide safe area.
  { x: 2300, y: 590, patrolMinX: 1980, patrolMaxX: 2700, detectionRange: 300, patrolSpeed: 55, chargeSpeed: 330 },
  // D: two separate patrol zones.
  { x: 4980, y: 590, patrolMinX: 4820, patrolMaxX: 5250, detectionRange: 320, patrolSpeed: 60, chargeSpeed: 345 },
  { x: 5850, y: 590, patrolMinX: 5600, patrolMaxX: 6000, detectionRange: 320, patrolSpeed: 60, chargeSpeed: 345 },
  // E: guards the platforming stretch.
  { x: 7050, y: 590, patrolMinX: 6760, patrolMaxX: 7480, detectionRange: 340, patrolSpeed: 65, chargeSpeed: 360 },
  // F: final pressure before the clue.
  { x: 8680, y: 590, patrolMinX: 8320, patrolMaxX: 9040, detectionRange: 340, patrolSpeed: 68, chargeSpeed: 375 },
];

function buildDecorations(): readonly PinosDecorationConfig[] {
  const decorations: PinosDecorationConfig[] = [];
  const scatter: [number, PinosDecorationConfig["kind"]][] = [
    [360, "toy"], [620, "bolt"], [980, "spring"], [1240, "cable"], [1520, "glow"],
    [1820, "toy"], [2180, "bolt"], [2620, "cable"], [2980, "spring"], [3260, "glow"],
    [3720, "bolt"], [4020, "toy"], [4460, "cable"], [4880, "spring"], [5240, "glow"],
    [5680, "bolt"], [6040, "toy"], [6420, "cable"], [6880, "spring"], [7240, "glow"],
    [7640, "bolt"], [8020, "toy"], [8460, "cable"], [8880, "spring"], [9280, "glow"],
    [9560, "toy"],
  ];
  for (const [x, kind] of scatter) {
    decorations.push({ x, y: 636, kind, scale: 0.9 + ((x % 4) * 0.12) });
  }
  return decorations;
}

export const pinosConfig: PinosLevelConfig = {
  world: { width: 10000, height: 720, voidY: 820 },
  playerSpawn: { x: 240, y: 560 },
  spaceship: { x: 120, y: 560 },
  platforms: [...GROUND_PLATFORMS, ...ELEVATED_PLATFORMS],
  decorations: buildDecorations(),
  enemies: ENEMIES,
  clue: { x: 9520, y: 560 },
};
