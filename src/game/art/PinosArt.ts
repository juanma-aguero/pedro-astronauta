import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { GAME_WIDTH } from "../config/gameConfig";
import type { PlatformConfig } from "../planets/planetTypes";

/**
 * Output frame for the Heavy Metal Plush illustration. The body collider is
 * separate (see BODY_SIZES.plush); this only positions the art above the feet.
 */
export const PLUSH_FRAME = { width: 150, height: 132, baseline: 122 } as const;

/* -------------------------------------------------------------------------- */
/* Procedural placeholder textures                                            */
/* -------------------------------------------------------------------------- */

const STEEL_DARK = "#1f2a2e";
const STEEL_MID = "#33454a";
const TEAL = "#2f6f6b";
const RUST = "#b5622f";
const MAGENTA = "#d6379b";
const CYAN = "#49d5e0";

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0c1a1e");
  sky.addColorStop(0.55, "#173033");
  sky.addColorStop(0.8, "#3a2f30");
  sky.addColorStop(1, "#5b3a2c");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Dirty haze band near the horizon.
  const haze = ctx.createLinearGradient(0, h * 0.6, 0, h);
  haze.addColorStop(0, "rgba(181,98,47,0)");
  haze.addColorStop(1, "rgba(181,98,47,0.28)");
  ctx.fillStyle = haze;
  ctx.fillRect(0, h * 0.6, w, h * 0.4);

  // Faint dead moon.
  ctx.fillStyle = "rgba(120,140,140,0.22)";
  ctx.beginPath();
  ctx.arc(w * 0.24, h * 0.26, 70, 0, Math.PI * 2);
  ctx.fill();
}

function drawRidges(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = STEEL_DARK;
  // Crooked towers and antennas along the baseline.
  let x = 10;
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  while (x < w - 40) {
    const tw = 26 + rnd() * 60;
    const th = 60 + rnd() * (h - 90);
    const lean = (rnd() - 0.5) * 18;
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + lean, h - th);
    ctx.lineTo(x + tw + lean, h - th - rnd() * 30);
    ctx.lineTo(x + tw, h);
    ctx.closePath();
    ctx.fill();
    // Antenna mast.
    if (rnd() > 0.5) {
      ctx.strokeStyle = STEEL_DARK;
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + tw / 2 + lean, h - th);
      ctx.lineTo(x + tw / 2 + lean + (rnd() - 0.5) * 20, h - th - 40 - rnd() * 50);
      ctx.stroke();
    }
    x += tw + 10 + rnd() * 46;
  }
}

function drawMetalTile(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = STEEL_MID;
  ctx.fillRect(0, 0, s, s);
  // Horizontal brushed streaks.
  for (let y = 2; y < s; y += 5) {
    ctx.strokeStyle = y % 10 === 2 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.18)";
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y);
    ctx.stroke();
  }
  // A couple of rust blooms.
  ctx.fillStyle = "rgba(181,98,47,0.35)";
  ctx.beginPath();
  ctx.arc(s * 0.3, s * 0.7, s * 0.16, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.arc(s * 0.8, s * 0.25, s * 0.1, 0, Math.PI * 2);
  ctx.fill();
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  ctx.fillStyle = "#8f9a9a";
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2a3436";
  ctx.lineWidth = Math.max(1, r * 0.35);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.6, y);
  ctx.lineTo(x + r * 0.6, y);
  ctx.stroke();
}

function drawPlush(ctx: CanvasRenderingContext2D, f: typeof PLUSH_FRAME): void {
  const cx = f.width / 2;
  const feet = f.baseline;
  ctx.lineJoin = "round";

  // Stubby legs.
  ctx.fillStyle = STEEL_DARK;
  ctx.fillRect(cx - 30, feet - 24, 20, 24);
  ctx.fillStyle = RUST;
  ctx.fillRect(cx + 10, feet - 24, 20, 24);

  // Patchwork body.
  ctx.fillStyle = TEAL;
  roundRect(ctx, cx - 42, feet - 78, 84, 58, 16);
  ctx.fill();
  // Rust fabric patch, stitched on.
  ctx.fillStyle = RUST;
  roundRect(ctx, cx - 6, feet - 74, 40, 34, 8);
  ctx.fill();
  stitch(ctx, cx - 6, feet - 74, cx + 34, feet - 74);
  stitch(ctx, cx - 6, feet - 40, cx + 34, feet - 40);

  // Metal chest plate with bolts.
  ctx.fillStyle = STEEL_MID;
  roundRect(ctx, cx - 36, feet - 66, 30, 34, 5);
  ctx.fill();
  bolt(ctx, cx - 30, feet - 60, 3);
  bolt(ctx, cx - 12, feet - 60, 3);
  bolt(ctx, cx - 30, feet - 40, 3);
  bolt(ctx, cx - 12, feet - 40, 3);

  // Arms: one fabric, one segmented metal.
  ctx.strokeStyle = TEAL;
  ctx.lineWidth = 12;
  ctx.beginPath();
  ctx.moveTo(cx - 40, feet - 66);
  ctx.lineTo(cx - 58, feet - 44);
  ctx.stroke();
  ctx.strokeStyle = "#7c8888";
  ctx.lineWidth = 8;
  ctx.beginPath();
  ctx.moveTo(cx + 40, feet - 66);
  ctx.lineTo(cx + 58, feet - 40);
  ctx.stroke();
  bolt(ctx, cx + 50, feet - 53, 3);

  // Head.
  ctx.fillStyle = TEAL;
  roundRect(ctx, cx - 30, feet - 116, 60, 44, 14);
  ctx.fill();
  // Seam across the crown.
  stitch(ctx, cx - 26, feet - 100, cx + 30, feet - 104);

  // One X-stitch button eye (magenta), one glowing LED eye (cyan).
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx - 18, feet - 100);
  ctx.lineTo(cx - 8, feet - 90);
  ctx.moveTo(cx - 8, feet - 100);
  ctx.lineTo(cx - 18, feet - 90);
  ctx.stroke();

  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(cx + 12, feet - 95, 6, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "rgba(73,213,224,0.35)";
  ctx.beginPath();
  ctx.arc(cx + 12, feet - 95, 12, 0, Math.PI * 2);
  ctx.fill();

  // Bent antenna with a glow tip.
  ctx.strokeStyle = "#8f9a9a";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 6, feet - 116);
  ctx.lineTo(cx + 14, feet - 132);
  ctx.lineTo(cx + 2, feet - 140);
  ctx.stroke();
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(cx + 2, feet - 140, 5, 0, Math.PI * 2);
  ctx.fill();

  // Mouth: crooked zigzag stitches.
  ctx.strokeStyle = "#12201f";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 14, feet - 80);
  ctx.lineTo(cx - 6, feet - 84);
  ctx.lineTo(cx + 2, feet - 80);
  ctx.lineTo(cx + 10, feet - 84);
  ctx.lineTo(cx + 18, feet - 80);
  ctx.stroke();
}

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function stitch(ctx: CanvasRenderingContext2D, x1: number, y1: number, x2: number, y2: number): void {
  ctx.save();
  ctx.strokeStyle = "rgba(255,240,220,0.75)";
  ctx.lineWidth = 1.5;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

/** Generates every Pinos placeholder texture. See PINOS_ART_SOURCES for swap-in. */
export function preparePinosArt(scene: Phaser.Scene): void {
  if (!scene.textures.exists(ASSET_KEYS.pinosSky)) {
    const t = scene.textures.createCanvas(ASSET_KEYS.pinosSky, 1280, 853)!;
    drawSky(t.context, 1280, 853);
    t.refresh();
  }
  if (!scene.textures.exists(ASSET_KEYS.pinosRidges)) {
    const t = scene.textures.createCanvas(ASSET_KEYS.pinosRidges, 760, 460)!;
    drawRidges(t.context, 760, 460);
    t.refresh();
  }
  if (!scene.textures.exists(ASSET_KEYS.pinosTerrain)) {
    const t = scene.textures.createCanvas(ASSET_KEYS.pinosTerrain, 96, 96)!;
    drawMetalTile(t.context, 96);
    t.refresh();
  }
  if (!scene.textures.exists(ASSET_KEYS.pinosPlushArt)) {
    const t = scene.textures.createCanvas(ASSET_KEYS.pinosPlushArt, PLUSH_FRAME.width, PLUSH_FRAME.height)!;
    t.context.imageSmoothingEnabled = true;
    drawPlush(t.context, PLUSH_FRAME);
    t.refresh();
  }
}

/* -------------------------------------------------------------------------- */
/* Scenery                                                                    */
/* -------------------------------------------------------------------------- */

/** Fixed sky plus parallax mechanical skylines. Mirrors SatenesArt's shape. */
export class PinosArt {
  private readonly layers: { images: Phaser.GameObjects.Image[]; width: number; factor: number }[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    scene.add.image(0, -108, ASSET_KEYS.pinosSky).setOrigin(0).setDisplaySize(1280, 853).setScrollFactor(0).setDepth(-100);

    // Slow, hazy far structures.
    this.addSkyline(1400, 470, 0.1, -80, 0.35, 0x243033);
    // Nearer crooked towers.
    this.addSkyline(1180, 560, 0.32, -70, 0.7, 0x161f21);

    // Floating glow motes / drifting sparks.
    for (let i = 0; i < 22; i++) {
      const x = (i * 151 + 47) % GAME_WIDTH;
      const y = 60 + (i * 83) % 360;
      const mote = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(i % 3 === 0 ? 0xd6379b : 0x49d5e0)
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(i % 4 === 0 ? 0.32 : 0.16)
        .setScrollFactor(0).setDepth(-85).setAlpha(0.28);
      scene.tweens.add({
        targets: mote, alpha: 0.7, y: y + 18,
        duration: 2200 + i * 130, delay: i * 90, yoyo: true, repeat: -1,
      });
    }
  }

  private addSkyline(width: number, bottom: number, factor: number, depth: number, alpha: number, tint: number): void {
    const images = Array.from({ length: 3 }, () =>
      this.scene.add.image(0, bottom, ASSET_KEYS.pinosRidges)
        .setOrigin(0, 1).setDisplaySize(width, width * 0.6)
        .setScrollFactor(0).setDepth(depth).setAlpha(alpha).setTint(tint),
    );
    this.layers.push({ images, width, factor });
  }

  update(scrollX = this.scene.cameras.main.scrollX): void {
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

/**
 * Worn metal platform: a tiled steel fill, a bright top lip, and a row of bolts.
 * Reads clearly as a solid surface against the background skylines.
 */
export function drawPinosTerrain(scene: Phaser.Scene, cfg: PlatformConfig): void {
  const left = cfg.x - cfg.width / 2;
  const top = cfg.y - cfg.height / 2;

  const fill = scene.add.tileSprite(left, top, cfg.width, cfg.height + 6, ASSET_KEYS.pinosTerrain)
    .setOrigin(0, 0).setDepth(1);
  fill.setTileScale(0.6, 0.6);

  const edge = scene.add.graphics().setDepth(2);
  edge.fillStyle(0x5a7a7a, 1).fillRect(left, top - 2, cfg.width, 5);
  edge.fillStyle(0x9ad0d0, 0.5).fillRect(left, top - 2, cfg.width, 2);
  edge.lineStyle(1, 0x0e1616, 0.6).strokeRect(left, top, cfg.width, cfg.height);

  const spacing = 46;
  for (let x = left + 16; x < left + cfg.width - 10; x += spacing) {
    edge.fillStyle(0x8f9a9a, 1).fillCircle(x, top + 8, 2.4);
    edge.fillStyle(0x2a3436, 1).fillRect(x - 1.6, top + 7, 3.2, 1.4);
  }
}

/** Small scattered Pinos props. Decorative only: no physics, no gameplay effect. */
export function drawPinosDecoration(
  scene: Phaser.Scene,
  kind: "bolt" | "cable" | "spring" | "toy" | "glow",
  x: number,
  y: number,
  scale = 1,
): void {
  const g = scene.add.graphics().setDepth(-1);
  switch (kind) {
    case "bolt":
      g.fillStyle(0x8f9a9a, 1).fillCircle(x, y, 6 * scale);
      g.lineStyle(2 * scale, 0x2a3436, 1).lineBetween(x - 5 * scale, y, x + 5 * scale, y);
      break;
    case "cable":
      g.lineStyle(3 * scale, 0x1c2727, 1);
      g.beginPath();
      g.moveTo(x - 24 * scale, y);
      g.lineTo(x - 8 * scale, y + 14 * scale);
      g.lineTo(x + 8 * scale, y - 6 * scale);
      g.lineTo(x + 24 * scale, y + 10 * scale);
      g.strokePath();
      break;
    case "spring": {
      g.lineStyle(2.5 * scale, 0xa7b2b2, 1);
      g.beginPath();
      g.moveTo(x - 6 * scale, y);
      for (let i = 1; i <= 8; i++) {
        g.lineTo(x + (i % 2 === 0 ? -6 : 6) * scale, y - i * 5 * scale);
      }
      g.strokePath();
      break;
    }
    case "toy":
      g.fillStyle(0xb5622f, 0.9).fillRoundedRect(x - 12 * scale, y - 12 * scale, 24 * scale, 20 * scale, 5 * scale);
      g.fillStyle(0x2f6f6b, 1).fillCircle(x - 4 * scale, y - 2 * scale, 4 * scale);
      g.lineStyle(1.5 * scale, 0xfff0dc, 0.7).strokeRoundedRect(x - 12 * scale, y - 12 * scale, 24 * scale, 20 * scale, 5 * scale);
      break;
    case "glow": {
      const light = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(0xd6379b).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.6 * scale).setAlpha(0.16).setDepth(-2);
      scene.tweens.add({ targets: light, alpha: 0.4, duration: 1800 + (x % 900), yoyo: true, repeat: -1 });
      g.destroy();
      return;
    }
  }
}

/** Pedro's lander on Pinos, drawn procedurally so it needs no planet PNG. */
export function drawPinosSpaceship(scene: Phaser.Scene, x: number, baseY: number): void {
  const g = scene.add.graphics().setDepth(-1);
  g.fillStyle(0x33454a, 1);
  g.fillRoundedRect(x - 34, baseY - 150, 68, 120, 20);
  g.fillStyle(0xb5622f, 1);
  g.fillTriangle(x - 34, baseY - 40, x - 66, baseY - 4, x - 6, baseY - 20);
  g.fillTriangle(x + 34, baseY - 40, x + 66, baseY - 4, x + 6, baseY - 20);
  g.fillStyle(0x49d5e0, 0.9).fillCircle(x, baseY - 104, 14);
  g.lineStyle(3, 0x8f9a9a, 1).strokeCircle(x, baseY - 104, 14);
  g.fillStyle(0x8f9a9a, 1);
  g.fillRect(x - 30, baseY - 30, 12, 30);
  g.fillRect(x + 18, baseY - 30, 12, 30);
  const flame = scene.add.image(x, baseY - 2, ASSET_KEYS.particle)
    .setTint(0xd6379b).setBlendMode(Phaser.BlendModes.ADD).setScale(2.2).setAlpha(0.3);
  scene.tweens.add({ targets: flame, alpha: 0.6, scaleX: 2.8, duration: 700, yoyo: true, repeat: -1 });
}
