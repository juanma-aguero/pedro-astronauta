import { ASSET_KEYS } from "./assetKeys";

export const ART_SOURCES = [
  { key: ASSET_KEYS.sky, file: "sky.png", matte: false },
  { key: "source-pedro", file: "pedro.png", matte: true },
  { key: "source-run", file: "pedro-run.png", matte: true },
  { key: "source-hurt", file: "pedro-hurt.png", matte: true },
  { key: "source-worm", file: "worm.png", matte: true },
  { key: ASSET_KEYS.props, file: "props.png", matte: true },
  { key: ASSET_KEYS.terrain, file: "terrain.png", matte: true },
  { key: ASSET_KEYS.ridges, file: "ridges.png", matte: true },
] as const;

/** World units: these are the original MVP collision dimensions. */
export const BODY_SIZES = {
  player: { width: 42, height: 58 },
  monster: { width: 48, height: 42 },
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
