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

/**
 * Pinos-owned artwork. Pinos currently ships with procedural placeholder
 * textures generated in `preparePinosArt`. To swap in final PNGs:
 *   1. drop the files into `public/assets/pinos/`
 *   2. add their entries here (key + path + matte)
 *   3. delete the matching generator call in `preparePinosArt`
 * Nothing in `PinosScene` or `HeavyMetalPlush` needs to change.
 */
export const PINOS_ART_SOURCES: readonly ArtSource[] = [
  // { key: ASSET_KEYS.pinosSky, path: "assets/pinos/sky.png", matte: false },
  // { key: ASSET_KEYS.pinosRidges, path: "assets/pinos/ridges.png", matte: true },
  // { key: ASSET_KEYS.pinosTerrain, path: "assets/pinos/terrain.png", matte: true },
  // { key: ASSET_KEYS.pinosProps, path: "assets/pinos/props.png", matte: true },
  // { key: ASSET_KEYS.pinosPlushArt, path: "assets/pinos/heavy-metal-plush.png", matte: true },
];

/**
 * Silencio-owned artwork. Like Pinos, Silencio currently ships with procedural
 * placeholder textures generated in `prepareSilencioArt`. To swap in final PNGs:
 *   1. drop the files into `public/assets/silencio/`
 *   2. add their entries here (key + path + matte)
 *   3. delete the matching generator call in `prepareSilencioArt`
 * Nothing in `SilencioScene` or `Oscuro` needs to change.
 */
export const SILENCIO_ART_SOURCES: readonly ArtSource[] = [
  // { key: ASSET_KEYS.silencioSky, path: "assets/silencio/sky.png", matte: false },
  // { key: ASSET_KEYS.silencioRidges, path: "assets/silencio/ridges.png", matte: true },
  // { key: ASSET_KEYS.silencioTerrain, path: "assets/silencio/terrain.png", matte: true },
  // { key: ASSET_KEYS.silencioProps, path: "assets/silencio/props.png", matte: true },
  // { key: ASSET_KEYS.silencioOscuroArt, path: "assets/silencio/oscuro.png", matte: true },
];

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
