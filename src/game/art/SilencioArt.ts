import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { SILENCIO_GROUND_SURFACE, SILENCIO_LANDING_FRAMES, SILENCIO_PROP_FRAMES } from "../config/artManifest";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import type { PlatformConfig } from "../planets/planetTypes";
import { opaqueBounds } from "./artPixels";

/** Artwork dimensions only: the original 46 × 52 collider stays unchanged. */
export const OSCURO_FRAME = { width: 184, height: 140, baseline: 128 } as const;
const CYAN_HEX = 0x8fbfff;

/** Decode source regions once, keeping transparent silhouettes and stable feet. */
export function prepareSilencioArt(scene: Phaser.Scene): void {
  for (const [key, frames] of [
    [ASSET_KEYS.silencioProps, SILENCIO_PROP_FRAMES],
    [ASSET_KEYS.silencioLanding, SILENCIO_LANDING_FRAMES],
  ] as const) {
    const texture = scene.textures.get(key);
    const source = texture.getSourceImage() as HTMLCanvasElement;
    const ctx = source.getContext("2d")!;
    for (const f of frames) {
      const b = opaqueBounds(ctx.getImageData(f.x, f.y, f.width, f.height).data, f.width, f.height);
      texture.add(f.name, 0, f.x + b.x, f.y + b.y, b.w, b.h);
      if (f.name === "oscuro") {
        const art = scene.textures.createCanvas(ASSET_KEYS.silencioOscuroArt, OSCURO_FRAME.width, OSCURO_FRAME.height)!;
        const scale = Math.min((OSCURO_FRAME.width - 12) / b.w, (OSCURO_FRAME.baseline - 8) / b.h);
        art.context.imageSmoothingEnabled = true;
        art.context.imageSmoothingQuality = "high";
        art.context.drawImage(source, f.x + b.x, f.y + b.y, b.w, b.h,
          (OSCURO_FRAME.width - b.w * scale) / 2, OSCURO_FRAME.baseline - b.h * scale, b.w * scale, b.h * scale);
        art.refresh();
      }
    }
  }

  // Use the level surface below the plants, so decoration cannot lift colliders.
  const source = scene.textures.get(ASSET_KEYS.silencioProps).getSourceImage() as HTMLCanvasElement;
  const ground = SILENCIO_GROUND_SURFACE;
  const terrain = scene.textures.createCanvas(ASSET_KEYS.silencioTerrain, ground.width, ground.height)!;
  terrain.context.drawImage(source, ground.x, ground.y, ground.width, ground.height, 0, 0, ground.width, ground.height);
  terrain.refresh();

  const props = scene.textures.get(ASSET_KEYS.silencioProps);
  const ledge = props.get("ledge");
  const cap = 90;
  props.add("ledge-left", 0, ledge.cutX, ledge.cutY, cap, ledge.cutHeight);
  props.add("ledge-middle", 0, ledge.cutX + cap, ledge.cutY, ledge.cutWidth - cap * 2, ledge.cutHeight);
  props.add("ledge-right", 0, ledge.cutX + ledge.cutWidth - cap, ledge.cutY, cap, ledge.cutHeight);

  // Keep live sound pulses procedural so their radius follows gameplay exactly.
  const ring = scene.textures.createCanvas(ASSET_KEYS.silencioNoiseRing, 64, 64)!;
  ring.context.strokeStyle = "#ffffff";
  ring.context.lineWidth = 4;
  ring.context.beginPath();
  ring.context.arc(32, 32, 28, 0, Math.PI * 2);
  ring.context.stroke();
  ring.refresh();
}

/** A mirrored painted panorama with independently drifting fog and cold motes. */
export class SilencioArt {
  private readonly panorama: Phaser.GameObjects.Image[];
  private readonly fog: { image: Phaser.GameObjects.Image; speed: number }[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    this.panorama = Array.from({ length: 3 }, () => scene.add.image(0, -80, ASSET_KEYS.silencioSky)
      .setOrigin(0).setDisplaySize(GAME_WIDTH, GAME_WIDTH * 1024 / 1536)
      .setScrollFactor(0).setDepth(-100));

    for (let i = 0; i < 5; i++) {
      const image = scene.add.image((i * 340) % GAME_WIDTH, 400 + (i * 70) % 240, ASSET_KEYS.particle)
        .setTint(0x9dbdeb).setAlpha(0.035).setScrollFactor(0).setDepth(-45)
        .setDisplaySize(720, 200);
      this.fog.push({ image, speed: 4 + i * 2.5 });
    }
    for (let i = 0; i < 16; i++) {
      const x = (i * 173 + 40) % GAME_WIDTH;
      const y = (i * 231 + 60) % GAME_HEIGHT;
      const mote = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(CYAN_HEX).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(i % 5 === 0 ? 0.22 : 0.1).setAlpha(0.12)
        .setScrollFactor(0).setDepth(-80);
      scene.tweens.add({ targets: mote, alpha: 0.32, y: y + 14, duration: 3000 + i * 200, delay: i * 130, yoyo: true, repeat: -1 });
    }
    this.update(0);
  }

  update(scrollX = this.scene.cameras.main.scrollX): void {
    const offset = scrollX * 0.16;
    const first = Math.floor(offset / GAME_WIDTH);
    this.panorama.forEach((image, index) => {
      const tile = first + index;
      image.x = tile * GAME_WIDTH - offset;
      image.setFlipX(tile % 2 !== 0);
    });
    for (const bank of this.fog) {
      bank.image.x -= bank.speed * (this.scene.game.loop.delta / 1000);
      if (bank.image.x < -420) bank.image.x = GAME_WIDTH + 420;
    }
  }
}

/** Painted rock tops follow the collider; jagged undersides extend below it. */
export function drawSilencioTerrain(scene: Phaser.Scene, cfg: PlatformConfig): void {
  const left = cfg.x - cfg.width / 2;
  const top = cfg.y - cfg.height / 2;
  if (cfg.height >= 60) {
    const height = cfg.height + 36;
    scene.add.tileSprite(left, top, cfg.width, height, ASSET_KEYS.silencioTerrain)
      .setOrigin(0).setTileScale(height / SILENCIO_GROUND_SURFACE.height).setDepth(1);
    return;
  }

  const frame = scene.textures.get(ASSET_KEYS.silencioProps).get("ledge");
  const height = cfg.height + 26;
  const cap = 90 * height / frame.height;
  for (const [name, x, width] of [
    ["ledge-left", left, cap],
    ["ledge-middle", left + cap, cfg.width - cap * 2],
    ["ledge-right", left + cfg.width - cap, cap],
  ] as const) {
    scene.add.image(x, top, ASSET_KEYS.silencioProps, name)
      .setOrigin(0).setDisplaySize(width, height).setDepth(2);
  }
}

export type SilencioDecorationKind = "spire" | "glowplant" | "rock" | "fog";

/** Decorative silhouettes stay behind the walkable surfaces and characters. */
export function drawSilencioDecoration(
  scene: Phaser.Scene, kind: SilencioDecorationKind, x: number, y: number, scale = 1,
): void {
  if (kind === "fog") {
    const patch = scene.add.image(x, y - 20 * scale, ASSET_KEYS.particle)
      .setTint(0x9dbdeb).setAlpha(0.045).setDepth(-40)
      .setDisplaySize(360 * scale, 150 * scale);
    scene.tweens.add({ targets: patch, x: x + 60, alpha: 0.02, duration: 5000 + (x % 1500), yoyo: true, repeat: -1 });
    return;
  }
  const name = kind === "glowplant" ? "plant" : "spire";
  const frame = scene.textures.get(ASSET_KEYS.silencioLanding).get(name);
  const height = (kind === "spire" ? 150 : kind === "rock" ? 26 : 54) * scale;
  const prop = scene.add.image(x, y + 4, ASSET_KEYS.silencioLanding, name)
    .setOrigin(0.5, 1).setDisplaySize(height * frame.width / frame.height, height)
    .setFlipX(Math.floor(x / 100) % 2 === 0).setDepth(-1);
  if (kind === "spire") prop.setTint(0x8192b7);
}

export function drawSilencioSpaceship(scene: Phaser.Scene, x: number, baseY: number): void {
  const frame = scene.textures.get(ASSET_KEYS.silencioLanding).get("rocket");
  scene.add.image(x, baseY, ASSET_KEYS.silencioLanding, "rocket")
    .setOrigin(0.5, 1).setDisplaySize(225 * frame.width / frame.height, 225).setDepth(-1);
  const glow = scene.add.image(x - 25, baseY - 40, ASSET_KEYS.particle)
    .setTint(0xffa049).setBlendMode(Phaser.BlendModes.ADD).setAlpha(0.13)
    .setDisplaySize(200, 160).setDepth(-2);
  scene.tweens.add({ targets: glow, alpha: 0.2, duration: 2300, yoyo: true, repeat: -1 });
}
