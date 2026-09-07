import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { GAME_WIDTH, GAME_HEIGHT } from "../config/gameConfig";
import type { PlatformConfig } from "../planets/planetTypes";

/**
 * Output frame for the Oscuro illustration. The collider is separate
 * (BODY_SIZES.oscuro); this only positions the art above the feet.
 */
export const OSCURO_FRAME = { width: 132, height: 140, baseline: 128 } as const;

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

const NIGHT = "#05070d";
const NAVY = "#0c1430";
const DUSK = "#1a2444";
const STONE = "#141b2e";

/** Cold accent + background violet, as Phaser tint integers. */
const CYAN_HEX = 0x5fd6d0;
const VIOLET_HEX = 0x3a2f57;

/* -------------------------------------------------------------------------- */
/* Procedural placeholder textures                                            */
/* -------------------------------------------------------------------------- */

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, NIGHT);
  sky.addColorStop(0.5, NAVY);
  sky.addColorStop(0.82, DUSK);
  sky.addColorStop(1, "#243056");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Cold, distant moon with a soft halo.
  const mx = w * 0.72;
  const my = h * 0.22;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, 180);
  halo.addColorStop(0, "rgba(150,180,210,0.30)");
  halo.addColorStop(1, "rgba(150,180,210,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(mx - 180, my - 180, 360, 360);
  ctx.fillStyle = "rgba(190,205,225,0.55)";
  ctx.beginPath();
  ctx.arc(mx, my, 46, 0, Math.PI * 2);
  ctx.fill();

  // Sparse dim stars.
  let seed = 91;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 90; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.7;
    ctx.fillStyle = `rgba(200,215,235,${0.05 + rnd() * 0.25})`;
    ctx.fillRect(x, y, rnd() > 0.85 ? 2 : 1, rnd() > 0.85 ? 2 : 1);
  }
}

function drawSpires(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  let x = -20;
  let seed = 33;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  while (x < w + 20) {
    const base = 30 + rnd() * 90;
    const height = 120 + rnd() * (h - 140);
    const lean = (rnd() - 0.5) * 40;
    ctx.fillStyle = "#03040a";
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + base * 0.4 + lean, h - height);
    ctx.lineTo(x + base + lean * 0.5, h - height * (0.5 + rnd() * 0.3));
    ctx.lineTo(x + base, h);
    ctx.closePath();
    ctx.fill();
    x += base * (0.5 + rnd() * 0.7);
  }
}

function drawStoneTile(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.fillStyle = STONE;
  ctx.fillRect(0, 0, s, s);
  let seed = 7;
  const rnd = (): number => {
    seed = (seed * 1103515245 + 12345) & 0x7fffffff;
    return seed / 0x7fffffff;
  };
  for (let i = 0; i < 26; i++) {
    const x = rnd() * s;
    const y = rnd() * s;
    const r = 2 + rnd() * 7;
    ctx.fillStyle = rnd() > 0.5 ? "rgba(255,255,255,0.03)" : "rgba(0,0,0,0.22)";
    ctx.beginPath();
    ctx.arc(x, y, r, 0, Math.PI * 2);
    ctx.fill();
  }
  // A few hairline cracks.
  ctx.strokeStyle = "rgba(0,0,0,0.3)";
  ctx.lineWidth = 1;
  for (let i = 0; i < 3; i++) {
    ctx.beginPath();
    ctx.moveTo(rnd() * s, 0);
    ctx.lineTo(rnd() * s, s);
    ctx.stroke();
  }
}

function drawOscuro(ctx: CanvasRenderingContext2D, f: typeof OSCURO_FRAME): void {
  const cx = f.width / 2;
  const feet = f.baseline;

  // Wispy shadow "skirt" that frays into the ground.
  ctx.fillStyle = "rgba(4,5,12,0.85)";
  ctx.beginPath();
  ctx.moveTo(cx - 44, feet);
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = cx - 44 + t * 88;
    const y = feet - (i % 2 === 0 ? 10 : 22) - Math.sin(t * Math.PI) * 6;
    ctx.lineTo(x, y);
  }
  ctx.lineTo(cx + 44, feet);
  ctx.closePath();
  ctx.fill();

  // Hunched body.
  ctx.fillStyle = "#070912";
  ctx.beginPath();
  ctx.moveTo(cx - 40, feet - 8);
  ctx.quadraticCurveTo(cx - 52, feet - 78, cx - 12, feet - 104);
  ctx.quadraticCurveTo(cx + 6, feet - 118, cx + 30, feet - 96);
  ctx.quadraticCurveTo(cx + 50, feet - 74, cx + 40, feet - 8);
  ctx.closePath();
  ctx.fill();

  // Faint cold rim light along the back/top edge (keeps it readable when idle).
  ctx.strokeStyle = "rgba(95,214,208,0.28)";
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 40, feet - 40);
  ctx.quadraticCurveTo(cx - 50, feet - 80, cx - 12, feet - 104);
  ctx.quadraticCurveTo(cx + 6, feet - 118, cx + 26, feet - 100);
  ctx.stroke();

  // Two low, faint glowing eyes.
  for (const dx of [-11, 12]) {
    const ex = cx + dx;
    const ey = feet - 86;
    const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 12);
    glow.addColorStop(0, "rgba(120,240,235,0.9)");
    glow.addColorStop(1, "rgba(120,240,235,0)");
    ctx.fillStyle = glow;
    ctx.fillRect(ex - 12, ey - 12, 24, 24);
    ctx.fillStyle = "#dffffb";
    ctx.beginPath();
    ctx.arc(ex, ey, 2.6, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawNoiseRing(ctx: CanvasRenderingContext2D, s: number): void {
  ctx.clearRect(0, 0, s, s);
  ctx.strokeStyle = "#ffffff";
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.arc(s / 2, s / 2, s / 2 - 4, 0, Math.PI * 2);
  ctx.stroke();
}

/** Generates every Silencio placeholder texture. See SILENCIO_ART_SOURCES. */
export function prepareSilencioArt(scene: Phaser.Scene): void {
  const make = (key: string, w: number, h: number, draw: (c: CanvasRenderingContext2D) => void): void => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, w, h)!;
    texture.context.imageSmoothingEnabled = true;
    draw(texture.context);
    texture.refresh();
  };

  make(ASSET_KEYS.silencioSky, 1280, 853, (c) => drawSky(c, 1280, 853));
  make(ASSET_KEYS.silencioRidges, 780, 470, (c) => drawSpires(c, 780, 470));
  make(ASSET_KEYS.silencioTerrain, 96, 96, (c) => drawStoneTile(c, 96));
  make(ASSET_KEYS.silencioOscuroArt, OSCURO_FRAME.width, OSCURO_FRAME.height, (c) => drawOscuro(c, OSCURO_FRAME));
  make(ASSET_KEYS.silencioNoiseRing, 64, 64, (c) => drawNoiseRing(c, 64));
}

/* -------------------------------------------------------------------------- */
/* Scenery                                                                    */
/* -------------------------------------------------------------------------- */

/**
 * Silencio scenery: a near-black sky, layered spire silhouettes, and slow fog.
 * Darkness comes from the palette, not from covering the playfield — platforms,
 * Pedro and the Oscuros stay lit and readable.
 */
export class SilencioArt {
  private readonly layers: { images: Phaser.GameObjects.Image[]; width: number; factor: number }[] = [];
  private readonly fog: { image: Phaser.GameObjects.Image; speed: number }[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    scene.add.image(0, -108, ASSET_KEYS.silencioSky)
      .setOrigin(0).setDisplaySize(1280, 853).setScrollFactor(0).setDepth(-100);

    this.addSpireLayer(1500, 500, 0.08, -90, 0.55, 0x05070f);
    this.addSpireLayer(1200, 610, 0.26, -75, 0.85, 0x02030a);

    // Slow fog banks drifting across the mid-ground.
    for (let i = 0; i < 5; i++) {
      const image = scene.add.image((i * 340) % GAME_WIDTH, 360 + (i * 70) % 260, ASSET_KEYS.particle)
        .setTint(0x1a2444).setAlpha(0.1).setScrollFactor(0.35).setDepth(-45)
        .setDisplaySize(720, 320);
      this.fog.push({ image, speed: 4 + i * 2.5 });
    }

    // Barely-there atmospheric motes.
    for (let i = 0; i < 16; i++) {
      const x = (i * 173 + 40) % GAME_WIDTH;
      const y = (i * 231 + 60) % GAME_HEIGHT;
      const mote = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(CYAN_HEX).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(i % 5 === 0 ? 0.22 : 0.1).setAlpha(0.12)
        .setScrollFactor(0).setDepth(-80);
      scene.tweens.add({ targets: mote, alpha: 0.32, y: y + 14, duration: 3000 + i * 200, delay: i * 130, yoyo: true, repeat: -1 });
    }
  }

  private addSpireLayer(width: number, bottom: number, factor: number, depth: number, alpha: number, tint: number): void {
    const images = Array.from({ length: 3 }, () =>
      this.scene.add.image(0, bottom, ASSET_KEYS.silencioRidges)
        .setOrigin(0, 1).setDisplaySize(width, width * 0.62)
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
    for (const bank of this.fog) {
      bank.image.x -= bank.speed * (this.scene.game.loop.delta / 1000);
      if (bank.image.x < -420) bank.image.x = GAME_WIDTH + 420;
    }
  }
}


/**
 * Dark stone platform with a faint cold top edge so the walkable surface stays
 * clearly readable against the near-black background.
 */
export function drawSilencioTerrain(scene: Phaser.Scene, cfg: PlatformConfig): void {
  const left = cfg.x - cfg.width / 2;
  const top = cfg.y - cfg.height / 2;

  const fill = scene.add.tileSprite(left, top, cfg.width, cfg.height + 6, ASSET_KEYS.silencioTerrain)
    .setOrigin(0, 0).setDepth(1);
  fill.setTileScale(0.65, 0.65);

  const edge = scene.add.graphics().setDepth(2);
  edge.fillStyle(0x2a3a52, 1).fillRect(left, top - 2, cfg.width, 4);
  edge.fillStyle(CYAN_HEX, 0.22).fillRect(left, top - 2, cfg.width, 2);
  edge.lineStyle(1, 0x05070d, 0.7).strokeRect(left, top, cfg.width, cfg.height);

  // Occasional faint glow-moss so the surface has life without adding clutter.
  for (let x = left + 40; x < left + cfg.width - 30; x += 190) {
    const moss = scene.add.image(x, top + 2, ASSET_KEYS.particle)
      .setTint(CYAN_HEX).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5).setAlpha(0.16).setDepth(2);
    scene.tweens.add({ targets: moss, alpha: 0.3, duration: 2400 + (x % 700), yoyo: true, repeat: -1 });
  }
}

export type SilencioDecorationKind = "spire" | "glowplant" | "rock" | "fog";

/** Small scattered Silencio props. Decorative only: no physics, no gameplay. */
export function drawSilencioDecoration(
  scene: Phaser.Scene,
  kind: SilencioDecorationKind,
  x: number,
  y: number,
  scale = 1,
): void {
  switch (kind) {
    case "spire": {
      const g = scene.add.graphics().setDepth(-1);
      g.fillStyle(0x03040a, 1);
      g.fillTriangle(x - 18 * scale, y, x + 14 * scale, y, x - 2 * scale, y - 150 * scale);
      g.lineStyle(1.5, VIOLET_HEX, 0.4).lineBetween(x - 2 * scale, y - 150 * scale, x + 4 * scale, y - 60 * scale);
      break;
    }
    case "glowplant": {
      const g = scene.add.graphics().setDepth(-1);
      g.lineStyle(2 * scale, 0x0b1020, 1);
      g.beginPath();
      g.moveTo(x, y);
      g.lineTo(x + 3 * scale, y - 34 * scale);
      g.strokePath();
      const bulb = scene.add.image(x + 3 * scale, y - 38 * scale, ASSET_KEYS.particle)
        .setTint(CYAN_HEX).setBlendMode(Phaser.BlendModes.ADD).setScale(0.5 * scale).setAlpha(0.5).setDepth(-1);
      scene.tweens.add({ targets: bulb, alpha: 0.9, scale: 0.7 * scale, duration: 1800 + (x % 800), yoyo: true, repeat: -1 });
      scene.tweens.add({ targets: g, x: 2, duration: 2600 + (x % 900), yoyo: true, repeat: -1 });
      break;
    }
    case "rock": {
      const g = scene.add.graphics().setDepth(-1);
      g.fillStyle(0x0c1222, 1).fillEllipse(x, y - 5 * scale, 30 * scale, 16 * scale);
      g.fillStyle(0x2a3a52, 0.5).fillEllipse(x - 5 * scale, y - 9 * scale, 10 * scale, 4 * scale);
      break;
    }
    case "fog": {
      const patch = scene.add.image(x, y - 20 * scale, ASSET_KEYS.particle)
        .setTint(0x1a2444).setAlpha(0.12).setScrollFactor(0.6).setDepth(-40)
        .setDisplaySize(360 * scale, 150 * scale);
      scene.tweens.add({ targets: patch, x: x + 60, alpha: 0.05, duration: 5000 + (x % 1500), yoyo: true, repeat: -1 });
      break;
    }
  }
}


/** Pedro's lander on Silencio: dark hull, cold cockpit glow. */
export function drawSilencioSpaceship(scene: Phaser.Scene, x: number, baseY: number): void {
  const g = scene.add.graphics().setDepth(-1);
  g.fillStyle(0x0b1120, 1);
  g.fillRoundedRect(x - 34, baseY - 150, 68, 122, 20);
  g.fillStyle(0x141d33, 1);
  g.fillTriangle(x - 34, baseY - 40, x - 64, baseY - 4, x - 6, baseY - 20);
  g.fillTriangle(x + 34, baseY - 40, x + 64, baseY - 4, x + 6, baseY - 20);
  g.lineStyle(2, 0x2a3a52, 0.8).strokeRoundedRect(x - 34, baseY - 150, 68, 122, 20);
  g.fillStyle(0x8f9a9a, 1);
  g.fillRect(x - 30, baseY - 28, 12, 28);
  g.fillRect(x + 18, baseY - 28, 12, 28);

  const cockpit = scene.add.image(x, baseY - 104, ASSET_KEYS.particle)
    .setTint(CYAN_HEX).setBlendMode(Phaser.BlendModes.ADD).setScale(1.4).setAlpha(0.4).setDepth(-1);
  scene.tweens.add({ targets: cockpit, alpha: 0.7, duration: 2200, yoyo: true, repeat: -1 });
}
