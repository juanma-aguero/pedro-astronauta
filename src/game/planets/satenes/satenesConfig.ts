import type { BlueMonsterConfig } from "../../entities/enemies/BlueMonster";

export interface Position {
  x: number;
  y: number;
}

export interface PlatformConfig extends Position {
  /** `x` and `y` are the center of the rectangle. */
  width: number;
  height: number;
}

export interface DecorationConfig extends Position {
  kind: "star" | "rock" | "crater";
  scale?: number;
}

export interface PlanetLevelConfig {
  name: string;
  world: { width: number; height: number; voidY: number };
  playerSpawn: Position;
  spaceship: Position;
  platforms: readonly PlatformConfig[];
  decorations: readonly DecorationConfig[];
  enemies: readonly BlueMonsterConfig[];
  clue: Position;
}

const GROUND_Y = 680;
const GROUND_HEIGHT = 80;

/** Ground segments: [centerX, width]. Center Y and height are shared. */
const GROUND_SEGMENTS: readonly [number, number][] = [
  [800, 1600],
  [2480, 1440],
  [4095, 1410],
  [5740, 1520],
  [7400, 1400],
  [9145, 1710],
];

const GROUND_PLATFORMS: readonly PlatformConfig[] = GROUND_SEGMENTS.map(
  ([x, width]) => ({ x, y: GROUND_Y, width, height: GROUND_HEIGHT }),
);

const ELEVATED_PLATFORMS: readonly PlatformConfig[] = [
  { x: 700, y: 530, width: 260, height: 30 },
  { x: 1180, y: 455, width: 220, height: 30 },
  { x: 1980, y: 520, width: 240, height: 30 },
  { x: 2550, y: 430, width: 300, height: 30 },
  { x: 2980, y: 520, width: 180, height: 30 },
  { x: 3600, y: 500, width: 260, height: 30 },
  { x: 4150, y: 405, width: 240, height: 30 },
  { x: 4580, y: 520, width: 220, height: 30 },
  { x: 5250, y: 485, width: 280, height: 30 },
  { x: 5850, y: 390, width: 260, height: 30 },
  { x: 6350, y: 500, width: 220, height: 30 },
  { x: 6950, y: 500, width: 240, height: 30 },
  { x: 7480, y: 410, width: 300, height: 30 },
  { x: 7950, y: 520, width: 180, height: 30 },
  { x: 8500, y: 480, width: 260, height: 30 },
  { x: 9050, y: 395, width: 280, height: 30 },
  { x: 9500, y: 500, width: 240, height: 30 },
];

const ENEMIES: readonly BlueMonsterConfig[] = [
  { x: 1100, y: 590, patrolMinX: 900, patrolMaxX: 1300, detectionRange: 320, disengageRange: 520, maxRoamDistance: 80, patrolSpeed: 75, chaseSpeed: 125 },
  { x: 2300, y: 590, patrolMinX: 2050, patrolMaxX: 2600, detectionRange: 340, disengageRange: 540, maxRoamDistance: 80, patrolSpeed: 80, chaseSpeed: 135 },
  { x: 2900, y: 590, patrolMinX: 2750, patrolMaxX: 3050, detectionRange: 300, disengageRange: 500, maxRoamDistance: 60, patrolSpeed: 70, chaseSpeed: 125 },
  { x: 3900, y: 590, patrolMinX: 3650, patrolMaxX: 4400, detectionRange: 350, disengageRange: 560, maxRoamDistance: 90, patrolSpeed: 85, chaseSpeed: 140 },
  { x: 5550, y: 590, patrolMinX: 5250, patrolMaxX: 6000, detectionRange: 360, disengageRange: 580, maxRoamDistance: 100, patrolSpeed: 85, chaseSpeed: 145 },
  { x: 7200, y: 590, patrolMinX: 6900, patrolMaxX: 7700, detectionRange: 370, disengageRange: 600, maxRoamDistance: 100, patrolSpeed: 90, chaseSpeed: 150 },
  { x: 8800, y: 590, patrolMinX: 8500, patrolMaxX: 9300, detectionRange: 380, disengageRange: 620, maxRoamDistance: 110, patrolSpeed: 95, chaseSpeed: 155 },
];

/** Sparse alien-atmosphere decoration. No physics, no gameplay effect. */
function buildDecorations(): readonly DecorationConfig[] {
  const decorations: DecorationConfig[] = [];

  // Star field across the sky.
  const starSeed = [
    [180, 90], [520, 160], [910, 70], [1340, 200], [1720, 110],
    [2100, 60], [2480, 180], [2880, 130], [3300, 90], [3720, 210],
    [4100, 70], [4520, 150], [4980, 100], [5400, 190], [5820, 60],
    [6250, 140], [6700, 90], [7150, 200], [7600, 120], [8050, 70],
    [8500, 170], [8950, 100], [9400, 150], [9800, 80],
  ];
  for (const [x, y] of starSeed) {
    decorations.push({ x, y, kind: "star", scale: 0.6 + ((x % 5) * 0.15) });
  }

  // Ground rocks and craters near the surface.
  const groundSeed: [number, DecorationConfig["kind"]][] = [
    [420, "rock"], [1100, "crater"], [1500, "rock"], [2200, "crater"],
    [2700, "rock"], [3050, "crater"], [3550, "rock"], [4300, "crater"],
    [4700, "rock"], [5300, "crater"], [5900, "rock"], [6400, "crater"],
    [7000, "rock"], [7800, "crater"], [8400, "rock"], [9000, "crater"],
    [9600, "rock"],
  ];
  for (const [x, kind] of groundSeed) {
    decorations.push({ x, y: 636, kind, scale: 1 });
  }

  return decorations;
}

export const satenesConfig: PlanetLevelConfig = {
  name: "Satenes",
  world: { width: 10000, height: 720, voidY: 820 },
  playerSpawn: { x: 220, y: 580 },
  spaceship: { x: 110, y: 560 },
  platforms: [...GROUND_PLATFORMS, ...ELEVATED_PLATFORMS],
  decorations: buildDecorations(),
  enemies: ENEMIES,
  clue: { x: 9720, y: 580 },
};
