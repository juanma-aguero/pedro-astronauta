import { ASSET_KEYS } from "./assetKeys";

/**
 * Illustrated source images. Each entry carries its own path relative to the
 * public root, so the loader never has to know planet-specific path rules.
 * `matte` marks images that ship with a green key colour to remove once.
 */
export interface ArtSource {
  key: string;
  path: string;
  matte: boolean;
}

/** Shared Pedro artwork. Lives under assets/common and is never planet-owned. */
export const SHARED_ART_SOURCES: readonly ArtSource[] = [
  { key: "source-pedro", path: "assets/common/pedro.png", matte: true },
  { key: "source-run", path: "assets/common/pedro-run.png", matte: true },
  { key: "source-hurt", path: "assets/common/pedro-hurt.png", matte: true },
];

/** Satenes-owned artwork. */
export const SATENES_ART_SOURCES: readonly ArtSource[] = [
  { key: ASSET_KEYS.satenesSky, path: "assets/satenes/sky.png", matte: false },
  { key: "source-worm", path: "assets/satenes/worm.png", matte: true },
  { key: ASSET_KEYS.satenesProps, path: "assets/satenes/props.png", matte: true },
  { key: ASSET_KEYS.satenesTerrain, path: "assets/satenes/terrain.png", matte: true },
  { key: ASSET_KEYS.satenesRidges, path: "assets/satenes/ridges.png", matte: true },
];

/** Painted Pinos scenery and a keyed prop sheet; decoded once during boot. */
export const PINOS_ART_SOURCES: readonly ArtSource[] = [
  { key: ASSET_KEYS.pinosSky, path: "assets/pinos/scrapyard.png", matte: false },
  { key: ASSET_KEYS.pinosProps, path: "assets/pinos/props.png", matte: true },
];

/** Measured source regions, including a little safety margin around each prop. */
export const PINOS_PROP_FRAMES = [
  { name: "plush", x: 150, y: 104, width: 510, height: 405 },
  { name: "rocket", x: 936, y: 65, width: 350, height: 500 },
  { name: "ledge", x: 60, y: 706, width: 670, height: 142 },
  { name: "ground", x: 776, y: 640, width: 697, height: 289 },
] as const;

/** Moonlit Silencio artwork. Green source mattes are decoded once at boot. */
export const SILENCIO_ART_SOURCES: readonly ArtSource[] = [
  { key: ASSET_KEYS.silencioSky, path: "assets/silencio/caverns.png", matte: false },
  { key: ASSET_KEYS.silencioProps, path: "assets/silencio/props.png", matte: true },
  { key: ASSET_KEYS.silencioLanding, path: "assets/silencio/landing.png", matte: true },
];

export const SILENCIO_PROP_FRAMES = [
  { name: "oscuro", x: 130, y: 80, width: 565, height: 380 },
  { name: "noise-trap", x: 935, y: 200, width: 295, height: 260 },
  { name: "ledge", x: 100, y: 635, width: 615, height: 200 },
  { name: "ground", x: 790, y: 525, width: 635, height: 400 },
] as const;

export const SILENCIO_LANDING_FRAMES = [
  { name: "rocket", x: 105, y: 55, width: 605, height: 910 },
  { name: "plant", x: 945, y: 45, width: 400, height: 400 },
  { name: "spire", x: 920, y: 470, width: 480, height: 515 },
] as const;

/** Level rock top, below the decorative plants in the ground source region. */
export const SILENCIO_GROUND_SURFACE = { x: 820, y: 622, width: 565, height: 290 } as const;

/** Every image the boot loader must fetch, regardless of owner. */
export const ART_SOURCES: readonly ArtSource[] = [
  ...SHARED_ART_SOURCES,
  ...SATENES_ART_SOURCES,
  ...PINOS_ART_SOURCES,
  ...SILENCIO_ART_SOURCES,
];

/** World units: these are the original MVP collision dimensions. */
export const BODY_SIZES = {
  player: { width: 42, height: 58 },
  monster: { width: 48, height: 42 },
  plush: { width: 52, height: 48 },
  oscuro: { width: 46, height: 52 },
  clue: { width: 48, height: 48 },
} as const;

export const ANIMATIONS = {
  idle: "pedro-idle", run: "pedro-run", jump: "pedro-jump",
  fall: "pedro-fall", hurt: "pedro-hurt", crawl: "worm-crawl",
} as const;

export const PLAYER_FRAMES = { width: 128, height: 128, baseline: 124 };
export const MONSTER_FRAMES = { width: 128, height: 96, baseline: 92 };

/** Generated worm poses cross the nominal grid; these measured regions isolate them. */
export const WORM_POSES = [
  { x: 0, y: 0, width: 540, height: 512 },
  { x: 560, y: 0, width: 480, height: 512 },
  { x: 1080, y: 0, width: 456, height: 512 },
  { x: 0, y: 512, width: 540, height: 512 },
  { x: 540, y: 512, width: 520, height: 512 },
  { x: 1060, y: 512, width: 476, height: 512 },
] as const;

/** Source grid selection and final pose height; the output origin never moves. */
export const PEDRO_POSES = [
  { source: "source-pedro", columns: 4, rows: 2, index: 0, height: 100 },
  { source: "source-pedro", columns: 4, rows: 2, index: 1, height: 100 },
  { source: "source-run", columns: 2, rows: 2, index: 0, height: 96 },
  { source: "source-run", columns: 2, rows: 2, index: 1, height: 100 },
  { source: "source-run", columns: 2, rows: 2, index: 2, height: 96 },
  { source: "source-run", columns: 2, rows: 2, index: 3, height: 100 },
  { source: "source-pedro", columns: 4, rows: 2, index: 6, height: 84 },
  { source: "source-pedro", columns: 4, rows: 2, index: 7, height: 90 },
  { source: "source-hurt", columns: 1, rows: 1, index: 0, height: 100 },
] as const;

/** Source atlas rectangles, measured from the generated artwork. */
export const PROP_FRAMES = [
  { name: "rocket", x: 110, y: 40, width: 320, height: 452 },
  { name: "planet", x: 552, y: 54, width: 420, height: 420 },
  { name: "rocks", x: 1030, y: 230, width: 440, height: 238 },
  { name: "plant", x: 126, y: 534, width: 310, height: 400 },
  { name: "clue", x: 556, y: 548, width: 420, height: 380 },
  { name: "heart", x: 1080, y: 624, width: 310, height: 266 },
] as const;

export const TERRAIN_FRAMES = [
  { name: "ledge-left", x: 96, y: 214, width: 128, height: 164 },
  { name: "ledge-middle", x: 224, y: 214, width: 1088, height: 164 },
  { name: "ledge-right", x: 1312, y: 214, width: 128, height: 164 },
  { name: "ground-left", x: 64, y: 650, width: 128, height: 238 },
  { name: "ground-middle", x: 192, y: 650, width: 1152, height: 238 },
  { name: "ground-right", x: 1344, y: 650, width: 128, height: 238 },
] as const;
