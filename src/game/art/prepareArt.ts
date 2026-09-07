import type Phaser from "phaser";
import { ANIMATIONS, ART_SOURCES, BODY_SIZES, MONSTER_FRAMES, PEDRO_POSES, PLAYER_FRAMES, PROP_FRAMES, TERRAIN_FRAMES, WORM_POSES } from "../config/artManifest";
import { ASSET_KEYS } from "../config/assetKeys";
import { keyGreenMatte, opaqueBounds } from "./artPixels";

/** The generator supplies green mattes. Decode them once, never per frame. */
function removeMatte(scene: Phaser.Scene, key: string): void {
  const source = scene.textures.get(key).getSourceImage() as HTMLImageElement;
  const canvas = document.createElement("canvas");
  canvas.width = source.width;
  canvas.height = source.height;
  const context = canvas.getContext("2d", { willReadFrequently: true })!;
  context.drawImage(source, 0, 0);
  const pixels = context.getImageData(0, 0, canvas.width, canvas.height);
  keyGreenMatte(pixels.data);
  context.putImageData(pixels, 0, 0);
  scene.textures.remove(key);
  scene.textures.addCanvas(key, canvas);
}

function bounds(context: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  const { data } = context.getImageData(x, y, w, h);
  const b = opaqueBounds(data, w, h);
  return { ...b, x: x + b.x, y: y + b.y };
}

/** Fixed output canvases keep the feet and origin stable as poses change. */
function characterAtlas(scene: Phaser.Scene, player: boolean): void {
  const layout = player ? PLAYER_FRAMES : MONSTER_FRAMES;
  const count = player ? 9 : 6;
  const texture = scene.textures.createCanvas(player ? ASSET_KEYS.playerArt : ASSET_KEYS.monsterArt, layout.width * count, layout.height)!;
  const target = texture.context;
  target.imageSmoothingEnabled = true;
  target.imageSmoothingQuality = "high";
  for (let i = 0; i < count; i++) {
    const pose = player ? PEDRO_POSES[i] : undefined;
    const source = scene.textures.get(pose?.source ?? "source-worm").getSourceImage() as HTMLCanvasElement;
    const w = pose ? Math.floor(source.width / pose.columns) : WORM_POSES[i].width;
    const h = pose ? Math.floor(source.height / pose.rows) : WORM_POSES[i].height;
    const x = pose ? pose.index % pose.columns * w : WORM_POSES[i].x;
    const y = pose ? Math.floor(pose.index / pose.columns) * h : WORM_POSES[i].y;
    const b = bounds(source.getContext("2d")!, x, y, w, h);
    const scale = pose ? pose.height / b.h : 0.215;
    const dw = b.w * scale, dh = b.h * scale;
    target.drawImage(source, b.x, b.y, b.w, b.h, i * layout.width + (layout.width - dw) / 2, layout.baseline - dh, dw, dh);
    texture.add(i, 0, i * layout.width, 0, layout.width, layout.height);
  }
  texture.refresh();
}

export function prepareArt(scene: Phaser.Scene): void {
  for (const source of ART_SOURCES) if (source.matte) removeMatte(scene, source.key);
  for (const f of PROP_FRAMES) scene.textures.get(ASSET_KEYS.props).add(f.name, 0, f.x, f.y, f.width, f.height);
  for (const f of TERRAIN_FRAMES) scene.textures.get(ASSET_KEYS.terrain).add(f.name, 0, f.x, f.y, f.width, f.height);
  characterAtlas(scene, true);
  characterAtlas(scene, false);
  for (const key of ["source-pedro", "source-run", "source-hurt", "source-worm"]) scene.textures.remove(key);
  const physicsTextures = [
    [ASSET_KEYS.player, BODY_SIZES.player.width, BODY_SIZES.player.height],
    [ASSET_KEYS.blueMonster, BODY_SIZES.monster.width, BODY_SIZES.monster.height],
    [ASSET_KEYS.clue, BODY_SIZES.clue.width, BODY_SIZES.clue.height],
    [ASSET_KEYS.platform, 2, 2],
  ] as const;
  for (const [key, width, height] of physicsTextures) {
    const texture = scene.textures.createCanvas(key, width, height)!;
    texture.context.fillStyle = "#ffffff";
    texture.context.fillRect(0, 0, width, height);
    texture.refresh();
  }
  const particle = scene.textures.createCanvas(ASSET_KEYS.particle, 16, 16)!;
  const gradient = particle.context.createRadialGradient(8, 8, 0, 8, 8, 8);
  gradient.addColorStop(0, "#ffffff"); gradient.addColorStop(1, "#ffffff00");
  particle.context.fillStyle = gradient;
  particle.context.fillRect(0, 0, 16, 16);
  particle.refresh();
  const animations = [
    { key: ANIMATIONS.idle, texture: ASSET_KEYS.playerArt, frames: [0, 1], fps: 2, repeat: -1 },
    { key: ANIMATIONS.run, texture: ASSET_KEYS.playerArt, frames: [2, 3, 4, 5], fps: 10, repeat: -1 },
    { key: ANIMATIONS.jump, texture: ASSET_KEYS.playerArt, frames: [6], fps: 1, repeat: 0 },
    { key: ANIMATIONS.fall, texture: ASSET_KEYS.playerArt, frames: [7], fps: 1, repeat: 0 },
    { key: ANIMATIONS.hurt, texture: ASSET_KEYS.playerArt, frames: [8], fps: 1, repeat: 0 },
    { key: ANIMATIONS.crawl, texture: ASSET_KEYS.monsterArt, frames: [0, 1, 2, 3, 4, 5], fps: 7, repeat: -1 },
  ];
  for (const a of animations) {
    if (!scene.anims.exists(a.key)) scene.anims.create({ key: a.key, frames: a.frames.map(frame => ({ key: a.texture, frame })), frameRate: a.fps, repeat: a.repeat });
  }
}
