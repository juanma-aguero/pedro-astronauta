import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import type { PlatformConfig } from "../planets/satenes/satenesConfig";

/** Scenery is screen-sized; mirrored repeats meet seamlessly at either edge. */
export class SatenesArt {
  private readonly layers: { images: Phaser.GameObjects.Image[]; width: number; factor: number }[] = [];
  private readonly planet: Phaser.GameObjects.Image;

  constructor(private readonly scene: Phaser.Scene) {
    scene.add.image(0, -108, ASSET_KEYS.sky).setOrigin(0).setDisplaySize(1280, 853).setScrollFactor(0).setDepth(-100);
    this.planet = scene.add.image(977, 164, ASSET_KEYS.props, "planet").setDisplaySize(250, 250).setScrollFactor(0).setDepth(-90);
    scene.add.image(237, 201, ASSET_KEYS.props, "planet").setDisplaySize(60, 60).setTint(0x686caf).setAlpha(0.65).setScrollFactor(0).setDepth(-90);
    this.addRidges(1280, 690, 0.12, -80, 0.38, 0x8b8fbf);
    this.addRidges(1450, 775, 0.28, -70, 0.78, 0xffffff);
    for (let i = 0; i < 20; i++) {
      const x = (i * 173 + 83) % GAME_WIDTH;
      const y = 38 + (i * 97) % 340;
      const star = scene.add.image(x, y, ASSET_KEYS.particle).setScale(i % 4 === 0 ? 0.38 : 0.18).setScrollFactor(0).setDepth(-85).setAlpha(0.4);
      scene.tweens.add({ targets: star, alpha: 0.95, scale: star.scaleX * 1.5, duration: 1600 + i * 137, delay: i * 97, yoyo: true, repeat: -1 });
    }
  }

  private addRidges(width: number, bottom: number, factor: number, depth: number, alpha: number, tint: number): void {
    const images = Array.from({ length: 3 }, () => this.scene.add.image(0, bottom, ASSET_KEYS.ridges).setOrigin(0, 1).setDisplaySize(width, width * 2 / 3).setScrollFactor(0).setDepth(depth).setAlpha(alpha).setTint(tint));
    this.layers.push({ images, width, factor });
  }

  update(scrollX = this.scene.cameras.main.scrollX): void {
    this.planet.x = 977 - scrollX * 0.012;
    for (const layer of this.layers) {
      const offset = scrollX * layer.factor;
      const first = Math.floor(offset / layer.width);
      layer.images.forEach((image, index) => {
        const tile = first + index;
        image.x = tile * layer.width - offset;
        image.setFlipX(tile % 2 !== 0);
      });
    }
  }
}

/** The strip's top matches the collider; only its underside is ornamental. */
export function drawTerrain(scene: Phaser.Scene, cfg: PlatformConfig): void {
  const ground = cfg.height >= 60;
  const prefix = ground ? "ground" : "ledge";
  const height = ground ? cfg.height + 4 : cfg.height + 8;
  const sourceHeight = ground ? 238 : 164;
  const scale = height / sourceHeight;
  const cap = 128 * scale;
  const left = cfg.x - cfg.width / 2;
  const top = cfg.y - cfg.height / 2 - 1;
  scene.add.image(left, top, ASSET_KEYS.terrain, `${prefix}-left`).setOrigin(0).setDisplaySize(cap, height).setDepth(1);
  scene.add.image(left + cfg.width - cap, top, ASSET_KEYS.terrain, `${prefix}-right`).setOrigin(0).setDisplaySize(cap, height).setDepth(1);
  const fill = scene.add.tileSprite(left + cap, top, cfg.width - cap * 2, height, ASSET_KEYS.terrain, `${prefix}-middle`).setOrigin(0).setDepth(1);
  fill.setTileScale(scale, scale);
}

export function addPlant(scene: Phaser.Scene, x: number, y: number, height = 60): void {
  const plant = scene.add.image(x, y, ASSET_KEYS.props, "plant").setOrigin(0.5, 1).setDisplaySize(height * 0.775, height).setDepth(-1);
  const light = scene.add.image(x, y - height * 0.6, ASSET_KEYS.particle).setTint(0xe268ff).setBlendMode(Phaser.BlendModes.ADD).setScale(height / 14).setAlpha(0.13).setDepth(-2);
  scene.tweens.add({ targets: light, alpha: 0.26, duration: 2200 + x % 800, yoyo: true, repeat: -1 });
  scene.tweens.add({ targets: plant, angle: 2, duration: 2400 + x % 700, yoyo: true, repeat: -1 });
}

export function menuBackdrop(scene: Phaser.Scene): SatenesArt {
  const art = new SatenesArt(scene);
  art.update(0);
  scene.add.rectangle(GAME_WIDTH / 2, GAME_HEIGHT / 2, GAME_WIDTH, GAME_HEIGHT, 0x080d25, 0.38).setDepth(-10);
  return art;
}
