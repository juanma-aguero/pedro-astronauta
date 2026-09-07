import type { OscuroConfig } from "../../entities/enemies/Oscuro";
import type { NoiseTrapConfig } from "../../mechanics/noise/NoiseTrap";
import type { SilencioDecorationKind } from "../../art/SilencioArt";
import type { BasePlanetLevelConfig, PlatformConfig, Position } from "../planetTypes";

export interface SilencioDecorationConfig extends Position {
  kind: SilencioDecorationKind;
  scale?: number;
}

export interface SilencioLevelConfig extends BasePlanetLevelConfig {
  decorations: readonly SilencioDecorationConfig[];
  enemies: readonly OscuroConfig[];
  noiseTraps: readonly NoiseTrapConfig[];
}

const GROUND_Y = 680;
const GROUND_HEIGHT = 80;

/**
 * Ground segments: [centerX, width]. Five gentle pits of 150-160 px — Silencio
 * is about sound, not precision jumps, so nothing here is technical.
 *
 * A: 0-1600      arrival, spaceship, no Oscuro
 * B: 1760-4340   first listener — wide open tutorial encounter
 * C: 4500-5800   quiet passage — slow-walk past an Oscuro
 * D: 5950-7350   jump decision — platforms above a patrolling Oscuro
 * E: 7500-8700   noise trap — one loud environmental hazard + an Oscuro
 * F: 8850-9990   final approach — two overlapping territories, then the clue
 */
const GROUND_SEGMENTS: readonly [number, number][] = [
  [800, 1600],
  [3050, 2580],
  [5150, 1300],
  [6650, 1400],
  [8100, 1200],
  [9420, 1140],
];

const GROUND_PLATFORMS: readonly PlatformConfig[] = GROUND_SEGMENTS.map(
  ([x, width]) => ({ x, y: GROUND_Y, width, height: GROUND_HEIGHT }),
);

/** 14 elevated platforms. Tops between y=426 and y=526 (<= 151 px climb). */
const ELEVATED_PLATFORMS: readonly PlatformConfig[] = [
  // Section A.
  { x: 600, y: 540, width: 240, height: 26 },
  { x: 1150, y: 470, width: 220, height: 26 },
  // Section B.
  { x: 2100, y: 520, width: 260, height: 26 },
  { x: 2750, y: 450, width: 260, height: 26 },
  { x: 3450, y: 520, width: 240, height: 26 },
  { x: 3950, y: 470, width: 220, height: 26 },
  // Section C.
  { x: 4750, y: 540, width: 200, height: 26 },
  { x: 5350, y: 500, width: 220, height: 26 },
  // Section D — a clean route that stays off the ground.
  { x: 6150, y: 520, width: 190, height: 26 },
  { x: 6500, y: 440, width: 190, height: 26 },
  { x: 6850, y: 520, width: 190, height: 26 },
  // Section E — an alternative to touching the noise trap.
  { x: 7900, y: 500, width: 220, height: 26 },
  { x: 8350, y: 470, width: 200, height: 26 },
  // Section F.
  { x: 9150, y: 520, width: 200, height: 26 },
];

const OSCUROS: readonly OscuroConfig[] = [
  // B: the tutorial listener, alone in the open.
  { x: 2900, y: 588, homeMinX: 2650, homeMaxX: 3150, investigateSpeed: 70, huntSpeed: 150, closeAwarenessRange: 85, searchDurationMs: 2200 },
  // C: sits on the quiet passage; a slow walk slips past it.
  { x: 5150, y: 588, homeMinX: 5000, homeMaxX: 5300, investigateSpeed: 65, huntSpeed: 140, closeAwarenessRange: 80, searchDurationMs: 2000 },
  // D: patrols the ground below the platform route.
  { x: 6650, y: 588, homeMinX: 6300, homeMaxX: 7000, investigateSpeed: 75, huntSpeed: 155, closeAwarenessRange: 90, searchDurationMs: 2400, maxChaseDistance: 280 },
  // E: guards the noise-trap room.
  { x: 8300, y: 588, homeMinX: 8100, homeMaxX: 8500, investigateSpeed: 70, huntSpeed: 150, closeAwarenessRange: 85, searchDurationMs: 2600, maxChaseDistance: 180 },
  // F: two overlapping territories before the clue.
  { x: 9150, y: 588, homeMinX: 9000, homeMaxX: 9350, investigateSpeed: 80, huntSpeed: 160, closeAwarenessRange: 90, searchDurationMs: 2800, maxChaseDistance: 140 },
  { x: 9520, y: 588, homeMinX: 9350, homeMaxX: 9650, investigateSpeed: 80, huntSpeed: 160, closeAwarenessRange: 90, searchDurationMs: 2800, maxChaseDistance: 200 },
];

const NOISE_TRAPS: readonly NoiseTrapConfig[] = [
  // Section E: a loose scrap plate on the ground. Jump the platforms to avoid it.
  { x: 8000, y: 620, width: 92, height: 40, intensity: 1, radius: 720, cooldownMs: 1400 },
];

function buildDecorations(): readonly SilencioDecorationConfig[] {
  const decorations: SilencioDecorationConfig[] = [];
  const scatter: [number, SilencioDecorationKind][] = [
    [300, "spire"], [520, "glowplant"], [880, "rock"], [1240, "fog"], [1500, "glowplant"],
    [1900, "spire"], [2280, "rock"], [2640, "glowplant"], [3000, "fog"], [3360, "spire"],
    [3720, "glowplant"], [4080, "rock"], [4520, "spire"], [4880, "glowplant"], [5240, "fog"],
    [5600, "rock"], [5980, "spire"], [6360, "glowplant"], [6760, "rock"], [7160, "fog"],
    [7560, "spire"], [7960, "glowplant"], [8360, "rock"], [8760, "spire"], [9160, "glowplant"],
    [9560, "fog"], [9820, "glowplant"],
  ];
  for (const [x, kind] of scatter) {
    decorations.push({ x, y: 636, kind, scale: 0.85 + ((x % 5) * 0.08) });
  }
  return decorations;
}

export const silencioConfig: SilencioLevelConfig = {
  world: { width: 10000, height: 720, voidY: 820 },
  playerSpawn: { x: 240, y: 560 },
  spaceship: { x: 120, y: 560 },
  platforms: [...GROUND_PLATFORMS, ...ELEVATED_PLATFORMS],
  decorations: buildDecorations(),
  enemies: OSCUROS,
  noiseTraps: NOISE_TRAPS,
  clue: { x: 9820, y: 560 },
};
