import Phaser from "phaser";
import { ASSET_KEYS } from "../config/assetKeys";
import { PINOS_PROP_FRAMES } from "../config/artManifest";
import { opaqueBounds } from "./artPixels";
import { GAME_WIDTH } from "../config/gameConfig";
import type { PlatformConfig } from "../planets/planetTypes";

/**
 * Output frame for the Heavy Metal Plush illustration. The body collider is
 * separate (see BODY_SIZES.plush); this only positions the art above the feet.
 */
export const PLUSH_FRAME = { width: 168, height: 150, baseline: 138 } as const;

/* -------------------------------------------------------------------------- */
/* Palette                                                                    */
/* -------------------------------------------------------------------------- */

const STEEL_MID = "#3c4a51";
const STEEL_LIGHT = "#7d8b8e";
const TEAL = "#3f7b74";
const TEAL_DARK = "#2b5751";
const RUST = "#b6602e";
const RUST_DARK = "#8a4620";
const MAGENTA = "#d6379b";
const CYAN = "#57d6e0";
const RED_EYE = "#ff5230";
const HAZARD_YELLOW = "#e8b23c";

/** Deterministic PRNG so every generated texture is stable between runs. */
function makeRng(seed: number): () => number {
  let s = seed >>> 0;
  return () => {
    s = (s * 1103515245 + 12345) & 0x7fffffff;
    return s / 0x7fffffff;
  };
}

function roundRect(
  ctx: CanvasRenderingContext2D,
  x: number, y: number, w: number, h: number, r: number,
): void {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function stitch(
  ctx: CanvasRenderingContext2D,
  x1: number, y1: number, x2: number, y2: number,
  color = "rgba(255,240,220,0.8)",
): void {
  ctx.save();
  ctx.strokeStyle = color;
  ctx.lineWidth = 1.6;
  ctx.setLineDash([4, 3]);
  ctx.beginPath();
  ctx.moveTo(x1, y1);
  ctx.lineTo(x2, y2);
  ctx.stroke();
  ctx.restore();
}

function bolt(ctx: CanvasRenderingContext2D, x: number, y: number, r: number): void {
  const g = ctx.createRadialGradient(x - r * 0.3, y - r * 0.3, 0, x, y, r);
  g.addColorStop(0, "#c3cccc");
  g.addColorStop(1, "#5c6668");
  ctx.fillStyle = g;
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#1c2426";
  ctx.lineWidth = Math.max(1, r * 0.32);
  ctx.beginPath();
  ctx.moveTo(x - r * 0.62, y - r * 0.2);
  ctx.lineTo(x + r * 0.62, y + r * 0.2);
  ctx.moveTo(x - r * 0.2, y + r * 0.62);
  ctx.lineTo(x + r * 0.2, y - r * 0.62);
  ctx.stroke();
}

/* -------------------------------------------------------------------------- */
/* Sky                                                                        */
/* -------------------------------------------------------------------------- */

function drawSky(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const sky = ctx.createLinearGradient(0, 0, 0, h);
  sky.addColorStop(0, "#0a1622");
  sky.addColorStop(0.4, "#122a33");
  sky.addColorStop(0.68, "#2a2f37");
  sky.addColorStop(0.86, "#4a3327");
  sky.addColorStop(1, "#6a3a24");
  ctx.fillStyle = sky;
  ctx.fillRect(0, 0, w, h);

  // Stars, thinning toward the horizon haze.
  const rnd = makeRng(4211);
  for (let i = 0; i < 120; i++) {
    const x = rnd() * w;
    const y = rnd() * h * 0.62;
    const a = 0.06 + rnd() * 0.5 * (1 - y / (h * 0.62));
    ctx.fillStyle = `rgba(210,224,236,${a})`;
    const s = rnd() > 0.9 ? 2 : 1;
    ctx.fillRect(x, y, s, s);
  }

  // Big cold moon, upper right, with a soft halo and a few craters.
  const mx = w * 0.66;
  const my = h * 0.24;
  const mr = 92;
  const halo = ctx.createRadialGradient(mx, my, 0, mx, my, mr * 3);
  halo.addColorStop(0, "rgba(120,200,205,0.34)");
  halo.addColorStop(0.5, "rgba(90,150,170,0.12)");
  halo.addColorStop(1, "rgba(90,150,170,0)");
  ctx.fillStyle = halo;
  ctx.fillRect(mx - mr * 3, my - mr * 3, mr * 6, mr * 6);

  const disc = ctx.createRadialGradient(mx - mr * 0.3, my - mr * 0.3, mr * 0.2, mx, my, mr);
  disc.addColorStop(0, "#dff0ec");
  disc.addColorStop(0.7, "#a9cfd0");
  disc.addColorStop(1, "#6f9fa8");
  ctx.fillStyle = disc;
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.fill();

  ctx.save();
  ctx.beginPath();
  ctx.arc(mx, my, mr, 0, Math.PI * 2);
  ctx.clip();
  ctx.fillStyle = "rgba(70,110,120,0.35)";
  for (const [dx, dy, cr] of [[-30, -12, 16], [22, 18, 22], [10, -34, 10], [-14, 30, 12], [40, -20, 8]]) {
    ctx.beginPath();
    ctx.arc(mx + dx, my + dy, cr, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.restore();

  // Warm forge glow rising from the scrapyard along the bottom.
  const forge = ctx.createLinearGradient(0, h * 0.62, 0, h);
  forge.addColorStop(0, "rgba(198,96,40,0)");
  forge.addColorStop(1, "rgba(226,116,48,0.5)");
  ctx.fillStyle = forge;
  ctx.fillRect(0, h * 0.62, w, h * 0.38);

  // A couple of hot pools of light at ground level.
  for (const px of [w * 0.18, w * 0.52, w * 0.85]) {
    const pool = ctx.createRadialGradient(px, h, 0, px, h, 220);
    pool.addColorStop(0, "rgba(255,150,70,0.4)");
    pool.addColorStop(1, "rgba(255,150,70,0)");
    ctx.fillStyle = pool;
    ctx.fillRect(px - 220, h - 220, 440, 220);
  }
}

/* -------------------------------------------------------------------------- */
/* Skyline silhouette                                                         */
/* -------------------------------------------------------------------------- */

function drawRidges(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.clearRect(0, 0, w, h);
  const rnd = makeRng(97);
  ctx.fillStyle = "#141b1f";

  let x = -20;
  while (x < w + 40) {
    const kind = rnd();
    if (kind < 0.34) {
      // Warehouse block with a pitched or flat roof.
      const bw = 90 + rnd() * 150;
      const bh = 90 + rnd() * (h - 150);
      ctx.fillRect(x, h - bh, bw, bh);
      if (rnd() > 0.5) {
        ctx.beginPath();
        ctx.moveTo(x - 6, h - bh);
        ctx.lineTo(x + bw / 2, h - bh - 26 - rnd() * 20);
        ctx.lineTo(x + bw + 6, h - bh);
        ctx.closePath();
        ctx.fill();
      }
      // Window grid, punched back to sky (transparent).
      ctx.save();
      ctx.globalCompositeOperation = "destination-out";
      for (let wy = h - bh + 22; wy < h - 24; wy += 34) {
        for (let wx = x + 14; wx < x + bw - 16; wx += 30) {
          if (rnd() > 0.35) ctx.fillRect(wx, wy, 16, 20);
        }
      }
      ctx.restore();
      x += bw + 8 + rnd() * 40;
    } else if (kind < 0.62) {
      // Crooked tower / chimney with an antenna.
      const tw = 30 + rnd() * 50;
      const th = 120 + rnd() * (h - 150);
      const lean = (rnd() - 0.5) * 20;
      ctx.beginPath();
      ctx.moveTo(x, h);
      ctx.lineTo(x + lean, h - th);
      ctx.lineTo(x + tw + lean * 0.6, h - th - rnd() * 24);
      ctx.lineTo(x + tw, h);
      ctx.closePath();
      ctx.fill();
      ctx.strokeStyle = "#141b1f";
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.moveTo(x + tw / 2 + lean, h - th);
      ctx.lineTo(x + tw / 2 + lean + (rnd() - 0.5) * 22, h - th - 46 - rnd() * 46);
      ctx.stroke();
      x += tw + 14 + rnd() * 44;
    } else if (kind < 0.92) {
      // Scaffolding lattice.
      const gw = 70 + rnd() * 90;
      const gh = 100 + rnd() * (h - 140);
      ctx.strokeStyle = "#141b1f";
      ctx.lineWidth = 5;
      ctx.strokeRect(x, h - gh, gw, gh);
      ctx.lineWidth = 3;
      for (let gy = h - gh; gy < h; gy += 26) {
        ctx.beginPath();
        ctx.moveTo(x, gy);
        ctx.lineTo(x + gw, gy);
        ctx.moveTo(x, gy);
        ctx.lineTo(x + gw, gy + 26);
        ctx.moveTo(x + gw, gy);
        ctx.lineTo(x, gy + 26);
        ctx.stroke();
      }
      x += gw + 16 + rnd() * 40;
    } else {
      // A huge discarded plush-animal head, half-buried in the pile.
      const r = 46 + rnd() * 40;
      const cy = h - r * 0.35;
      ctx.beginPath();
      ctx.arc(x + r, cy, r, 0, Math.PI * 2);
      ctx.arc(x + r * 0.45, cy - r * 0.85, r * 0.36, 0, Math.PI * 2);
      ctx.arc(x + r * 1.55, cy - r * 0.85, r * 0.36, 0, Math.PI * 2);
      ctx.fill();
      x += r * 2 + 24 + rnd() * 60;
    }
  }
}

/* -------------------------------------------------------------------------- */
/* Terrain tile + hazard strip                                                */
/* -------------------------------------------------------------------------- */

function drawMetalTile(ctx: CanvasRenderingContext2D, s: number): void {
  const base = ctx.createLinearGradient(0, 0, 0, s);
  base.addColorStop(0, STEEL_MID);
  base.addColorStop(1, "#2b363c");
  ctx.fillStyle = base;
  ctx.fillRect(0, 0, s, s);

  // Panel seams.
  ctx.strokeStyle = "rgba(0,0,0,0.4)";
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, s - 2, s - 2);

  // Brushed horizontal streaks.
  for (let y = 3; y < s; y += 4) {
    ctx.strokeStyle = y % 8 === 3 ? "rgba(255,255,255,0.05)" : "rgba(0,0,0,0.14)";
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(0, y);
    ctx.lineTo(s, y);
    ctx.stroke();
  }

  // Rust blooms.
  const rnd = makeRng(51);
  for (let i = 0; i < 4; i++) {
    const bx = rnd() * s;
    const by = rnd() * s;
    const br = s * (0.08 + rnd() * 0.12);
    const bloom = ctx.createRadialGradient(bx, by, 0, bx, by, br);
    bloom.addColorStop(0, "rgba(176,86,42,0.55)");
    bloom.addColorStop(1, "rgba(176,86,42,0)");
    ctx.fillStyle = bloom;
    ctx.beginPath();
    ctx.arc(bx, by, br, 0, Math.PI * 2);
    ctx.fill();
  }

  // Corner rivets.
  for (const [rx, ry] of [[10, 10], [s - 10, 10], [10, s - 10], [s - 10, s - 10]]) {
    bolt(ctx, rx, ry, 3.2);
  }
}

function drawHazard(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.fillStyle = "#1c1c1c";
  ctx.fillRect(0, 0, w, h);
  ctx.fillStyle = HAZARD_YELLOW;
  const step = h * 1.6;
  for (let x = -h; x < w + h; x += step * 2) {
    ctx.beginPath();
    ctx.moveTo(x, h);
    ctx.lineTo(x + h, 0);
    ctx.lineTo(x + h + step, 0);
    ctx.lineTo(x + step, h);
    ctx.closePath();
    ctx.fill();
  }
  // Worn scuffs.
  const rnd = makeRng(19);
  ctx.fillStyle = "rgba(30,26,20,0.35)";
  for (let i = 0; i < 6; i++) ctx.fillRect(rnd() * w, rnd() * h, 6 + rnd() * 14, h);
}

/* -------------------------------------------------------------------------- */
/* Heavy Metal Plush                                                          */
/* -------------------------------------------------------------------------- */

function drawPlush(ctx: CanvasRenderingContext2D, f: typeof PLUSH_FRAME): void {
  const cx = f.width / 2;
  const feet = f.baseline;
  ctx.lineJoin = "round";
  ctx.lineCap = "round";

  // Contact shadow.
  ctx.fillStyle = "rgba(0,0,0,0.28)";
  ctx.beginPath();
  ctx.ellipse(cx, feet + 2, 44, 8, 0, 0, Math.PI * 2);
  ctx.fill();

  // Stubby legs: one plush teal, one salvaged rust.
  ctx.fillStyle = TEAL_DARK;
  roundRect(ctx, cx - 34, feet - 26, 24, 26, 7);
  ctx.fill();
  ctx.fillStyle = RUST_DARK;
  roundRect(ctx, cx + 10, feet - 26, 24, 26, 7);
  ctx.fill();
  stitch(ctx, cx - 32, feet - 14, cx - 12, feet - 14);

  // Patchwork body.
  ctx.fillStyle = TEAL;
  roundRect(ctx, cx - 48, feet - 92, 96, 70, 20);
  ctx.fill();
  // Big rust fabric patch, stitched on askew.
  ctx.save();
  ctx.translate(cx + 14, feet - 58);
  ctx.rotate(-0.08);
  ctx.fillStyle = RUST;
  roundRect(ctx, -22, -26, 44, 46, 8);
  ctx.fill();
  stitch(ctx, -22, -22, 22, -24);
  stitch(ctx, -22, 16, 22, 18);
  ctx.restore();

  // Riveted metal belly plate.
  ctx.fillStyle = STEEL_MID;
  roundRect(ctx, cx - 42, feet - 84, 34, 44, 6);
  ctx.fill();
  ctx.strokeStyle = "rgba(0,0,0,0.35)";
  ctx.lineWidth = 1.5;
  roundRect(ctx, cx - 42, feet - 84, 34, 44, 6);
  ctx.stroke();
  for (const by of [feet - 76, feet - 56]) {
    bolt(ctx, cx - 36, by, 3);
    bolt(ctx, cx - 14, by, 3);
  }

  // Arms: left segmented-metal claw, right frayed cloth stump.
  ctx.strokeStyle = STEEL_LIGHT;
  ctx.lineWidth = 9;
  ctx.beginPath();
  ctx.moveTo(cx - 46, feet - 82);
  ctx.lineTo(cx - 66, feet - 58);
  ctx.stroke();
  bolt(ctx, cx - 56, feet - 70, 3);
  ctx.strokeStyle = STEEL_LIGHT;
  ctx.lineWidth = 4;
  ctx.beginPath();
  ctx.moveTo(cx - 66, feet - 58);
  ctx.lineTo(cx - 74, feet - 48);
  ctx.moveTo(cx - 66, feet - 58);
  ctx.lineTo(cx - 60, feet - 46);
  ctx.stroke();

  ctx.strokeStyle = RUST;
  ctx.lineWidth = 13;
  ctx.beginPath();
  ctx.moveTo(cx + 46, feet - 82);
  ctx.lineTo(cx + 64, feet - 62);
  ctx.stroke();
  ctx.strokeStyle = MAGENTA;
  ctx.lineWidth = 2.5;
  for (let i = 0; i < 4; i++) {
    ctx.beginPath();
    ctx.moveTo(cx + 62 + i * 2, feet - 62);
    ctx.lineTo(cx + 70 + i * 3, feet - 54 + i * 3);
    ctx.stroke();
  }

  // Head: two-tone, teal left / rust right, seam down the middle.
  ctx.fillStyle = TEAL;
  roundRect(ctx, cx - 34, feet - 138, 68, 50, 16);
  ctx.fill();
  ctx.save();
  roundRect(ctx, cx - 34, feet - 138, 68, 50, 16);
  ctx.clip();
  ctx.fillStyle = RUST;
  ctx.fillRect(cx, feet - 138, 34, 50);
  ctx.restore();
  stitch(ctx, cx, feet - 136, cx + 1, feet - 88, "rgba(20,16,14,0.7)");
  stitch(ctx, cx - 30, feet - 120, cx + 30, feet - 124);

  // Ears: floppy plush left, bolted metal disc right.
  ctx.fillStyle = TEAL_DARK;
  ctx.beginPath();
  ctx.ellipse(cx - 30, feet - 138, 12, 14, -0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = STEEL_MID;
  ctx.beginPath();
  ctx.arc(cx + 30, feet - 138, 12, 0, Math.PI * 2);
  ctx.fill();
  bolt(ctx, cx + 30, feet - 138, 3);

  // Left eye: glowing red mechanical lens.
  const ex = cx - 15;
  const ey = feet - 114;
  const glow = ctx.createRadialGradient(ex, ey, 0, ex, ey, 16);
  glow.addColorStop(0, "rgba(255,90,50,0.85)");
  glow.addColorStop(1, "rgba(255,90,50,0)");
  ctx.fillStyle = glow;
  ctx.fillRect(ex - 16, ey - 16, 32, 32);
  ctx.fillStyle = "#20262a";
  ctx.beginPath();
  ctx.arc(ex, ey, 8, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = RED_EYE;
  ctx.beginPath();
  ctx.arc(ex, ey, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = "#ffd8cc";
  ctx.beginPath();
  ctx.arc(ex - 1.5, ey - 1.5, 1.6, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#20262a";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.arc(ex, ey, 9, 0, Math.PI * 2);
  ctx.stroke();

  // Right eye: dark X-stitch button.
  ctx.strokeStyle = "#1b1512";
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(cx + 10, feet - 120);
  ctx.lineTo(cx + 22, feet - 108);
  ctx.moveTo(cx + 22, feet - 120);
  ctx.lineTo(cx + 10, feet - 108);
  ctx.stroke();

  // Crooked zigzag stitch mouth.
  ctx.strokeStyle = "#15100e";
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(cx - 16, feet - 98);
  ctx.lineTo(cx - 8, feet - 102);
  ctx.lineTo(cx, feet - 97);
  ctx.lineTo(cx + 8, feet - 102);
  ctx.lineTo(cx + 16, feet - 97);
  ctx.stroke();

  // Two bent antennas with glow tips.
  ctx.strokeStyle = STEEL_LIGHT;
  ctx.lineWidth = 2.5;
  ctx.beginPath();
  ctx.moveTo(cx - 6, feet - 138);
  ctx.lineTo(cx - 12, feet - 156);
  ctx.lineTo(cx - 2, feet - 164);
  ctx.moveTo(cx + 8, feet - 138);
  ctx.lineTo(cx + 14, feet - 152);
  ctx.stroke();
  ctx.fillStyle = MAGENTA;
  ctx.beginPath();
  ctx.arc(cx - 2, feet - 164, 4, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = CYAN;
  ctx.beginPath();
  ctx.arc(cx + 14, feet - 152, 3.5, 0, Math.PI * 2);
  ctx.fill();
}

/* -------------------------------------------------------------------------- */
/* Big background props                                                       */
/* -------------------------------------------------------------------------- */

function drawBear(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  const cx = w / 2;
  const fur = "#7a5f7d";
  const furDark = "#5c4560";
  const furLight = "#96789a";

  // Body.
  ctx.fillStyle = fur;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.72, w * 0.40, h * 0.32, 0, 0, Math.PI * 2);
  ctx.fill();
  // Head.
  ctx.beginPath();
  ctx.arc(cx, h * 0.34, w * 0.27, 0, Math.PI * 2);
  ctx.fill();
  // Ears.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.arc(cx + s * w * 0.22, h * 0.16, w * 0.11, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = furDark;
    ctx.beginPath();
    ctx.arc(cx + s * w * 0.22, h * 0.17, w * 0.06, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = fur;
  }
  // Arms.
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.ellipse(cx + s * w * 0.40, h * 0.62, w * 0.13, h * 0.20, s * 0.4, 0, Math.PI * 2);
    ctx.fill();
  }

  // Muzzle.
  ctx.fillStyle = furLight;
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.40, w * 0.15, h * 0.11, 0, 0, Math.PI * 2);
  ctx.fill();
  // Nose + smile.
  ctx.fillStyle = "#2c2230";
  ctx.beginPath();
  ctx.ellipse(cx, h * 0.36, w * 0.05, h * 0.03, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.strokeStyle = "#2c2230";
  ctx.lineWidth = w * 0.012;
  ctx.beginPath();
  ctx.arc(cx, h * 0.40, w * 0.09, 0.2 * Math.PI, 0.8 * Math.PI);
  ctx.stroke();
  // Eyes: one stitched shut, one glassy button.
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.13, h * 0.30);
  ctx.lineTo(cx - w * 0.05, h * 0.30);
  ctx.stroke();
  ctx.fillStyle = "#1c1620";
  ctx.beginPath();
  ctx.arc(cx + w * 0.09, h * 0.30, w * 0.03, 0, Math.PI * 2);
  ctx.fill();

  // Seams + repair stitches.
  ctx.strokeStyle = "rgba(30,22,34,0.55)";
  ctx.lineWidth = w * 0.008;
  ctx.beginPath();
  ctx.arc(cx, h * 0.34, w * 0.27, -0.35 * Math.PI, 0.15 * Math.PI);
  ctx.stroke();
  ctx.save();
  ctx.strokeStyle = "rgba(220,205,225,0.45)";
  ctx.setLineDash([w * 0.018, w * 0.014]);
  ctx.lineWidth = w * 0.009;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.24, h * 0.56);
  ctx.lineTo(cx - w * 0.09, h * 0.53);
  ctx.stroke();
  ctx.restore();

  // Giant X-stitch belly button.
  ctx.strokeStyle = "#2c2230";
  ctx.lineWidth = w * 0.02;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.06, h * 0.66);
  ctx.lineTo(cx + w * 0.06, h * 0.78);
  ctx.moveTo(cx + w * 0.06, h * 0.66);
  ctx.lineTo(cx - w * 0.06, h * 0.78);
  ctx.stroke();
}

function drawCrane(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  ctx.strokeStyle = "#1b2529";
  ctx.fillStyle = "#1b2529";
  const mastX = w * 0.22;

  // Lattice mast.
  ctx.lineWidth = 6;
  ctx.strokeRect(mastX - 16, 24, 32, h - 24);
  ctx.lineWidth = 3;
  for (let y = 30; y < h; y += 24) {
    ctx.beginPath();
    ctx.moveTo(mastX - 16, y);
    ctx.lineTo(mastX + 16, y + 24);
    ctx.moveTo(mastX + 16, y);
    ctx.lineTo(mastX - 16, y + 24);
    ctx.stroke();
  }

  // Jib arm reaching right.
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(mastX, 30);
  ctx.lineTo(w - 20, 62);
  ctx.moveTo(mastX, 54);
  ctx.lineTo(w - 20, 78);
  ctx.stroke();
  ctx.lineWidth = 3;
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    ctx.beginPath();
    ctx.moveTo(mastX + t * (w - 20 - mastX), 30 + t * 32);
    ctx.lineTo(mastX + t * (w - 20 - mastX), 54 + t * 24);
    ctx.stroke();
  }

  // Cable + claw with a red pilot light.
  const clawX = w - 40;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(clawX, 72);
  ctx.lineTo(clawX, h * 0.5);
  ctx.stroke();
  ctx.fillStyle = "#2a373c";
  roundRect(ctx, clawX - 14, h * 0.5, 28, 20, 4);
  ctx.fill();
  ctx.strokeStyle = "#2a373c";
  ctx.lineWidth = 6;
  ctx.beginPath();
  ctx.moveTo(clawX - 12, h * 0.5 + 18);
  ctx.quadraticCurveTo(clawX - 24, h * 0.5 + 44, clawX - 6, h * 0.5 + 52);
  ctx.moveTo(clawX + 12, h * 0.5 + 18);
  ctx.quadraticCurveTo(clawX + 24, h * 0.5 + 44, clawX + 6, h * 0.5 + 52);
  ctx.stroke();
  const light = ctx.createRadialGradient(clawX, h * 0.5 + 10, 0, clawX, h * 0.5 + 10, 12);
  light.addColorStop(0, "rgba(255,70,50,0.95)");
  light.addColorStop(1, "rgba(255,70,50,0)");
  ctx.fillStyle = light;
  ctx.fillRect(clawX - 12, h * 0.5 - 2, 24, 24);
}

function drawBanner(ctx: CanvasRenderingContext2D, w: number, h: number): void {
  // Cloth with a torn, tattered hem.
  ctx.fillStyle = "#8a2f3d";
  ctx.beginPath();
  ctx.moveTo(4, 0);
  ctx.lineTo(w - 4, 0);
  ctx.lineTo(w - 4, h - 26);
  for (let i = 6; i >= 0; i--) {
    ctx.lineTo(((w - 8) / 6) * i + 4, h - (i % 2 === 0 ? 4 : 26));
  }
  ctx.closePath();
  ctx.fill();
  // Shading down one side.
  const shade = ctx.createLinearGradient(0, 0, w, 0);
  shade.addColorStop(0, "rgba(255,255,255,0.08)");
  shade.addColorStop(1, "rgba(0,0,0,0.28)");
  ctx.fillStyle = shade;
  ctx.fillRect(4, 0, w - 8, h - 20);

  // Pale dead-rabbit emblem.
  const cx = w / 2;
  const cy = h * 0.42;
  ctx.fillStyle = "rgba(240,224,224,0.9)";
  ctx.beginPath();
  ctx.arc(cx, cy, w * 0.2, 0, Math.PI * 2);
  ctx.fill();
  for (const s of [-1, 1]) {
    ctx.save();
    ctx.translate(cx + s * w * 0.12, cy - w * 0.16);
    ctx.rotate(s * 0.3);
    ctx.beginPath();
    ctx.ellipse(0, -w * 0.14, w * 0.07, w * 0.2, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
  // X eyes + little cross stitch mouth.
  ctx.strokeStyle = "#8a2f3d";
  ctx.lineWidth = w * 0.03;
  for (const s of [-1, 1]) {
    ctx.beginPath();
    ctx.moveTo(cx + s * w * 0.09 - w * 0.04, cy - w * 0.04);
    ctx.lineTo(cx + s * w * 0.09 + w * 0.04, cy + w * 0.04);
    ctx.moveTo(cx + s * w * 0.09 + w * 0.04, cy - w * 0.04);
    ctx.lineTo(cx + s * w * 0.09 - w * 0.04, cy + w * 0.04);
    ctx.stroke();
  }
  ctx.lineWidth = w * 0.02;
  ctx.beginPath();
  ctx.moveTo(cx - w * 0.05, cy + w * 0.12);
  ctx.lineTo(cx + w * 0.05, cy + w * 0.12);
  ctx.stroke();
}

/* -------------------------------------------------------------------------- */
/* Texture generation                                                         */
/* -------------------------------------------------------------------------- */

/** Prepare painted props with stable baselines; retain procedural art as fallback. */
export function preparePinosArt(scene: Phaser.Scene): void {
  if (scene.textures.exists(ASSET_KEYS.pinosProps)) {
    const source = scene.textures.get(ASSET_KEYS.pinosProps).getSourceImage() as HTMLCanvasElement;
    const ctx = source.getContext("2d")!;
    for (const frame of PINOS_PROP_FRAMES) {
      const pixels = ctx.getImageData(frame.x, frame.y, frame.width, frame.height);
      const b = opaqueBounds(pixels.data, frame.width, frame.height);
      scene.textures.get(ASSET_KEYS.pinosProps).add(frame.name, 0, frame.x + b.x, frame.y + b.y, b.w, b.h);
      if (frame.name === "plush") {
        const texture = scene.textures.createCanvas(ASSET_KEYS.pinosPlushArt, PLUSH_FRAME.width, PLUSH_FRAME.height)!;
        const scale = Math.min(156 / b.w, 130 / b.h);
        texture.context.imageSmoothingQuality = "high";
        texture.context.drawImage(source, frame.x + b.x, frame.y + b.y, b.w, b.h,
          (PLUSH_FRAME.width - b.w * scale) / 2, PLUSH_FRAME.baseline - b.h * scale, b.w * scale, b.h * scale);
        texture.refresh();
      }
      if (frame.name === "ground") {
        const texture = scene.textures.createCanvas(ASSET_KEYS.pinosTerrain, b.w, b.h)!;
        texture.context.drawImage(source, frame.x + b.x, frame.y + b.y, b.w, b.h, 0, 0, b.w, b.h);
        texture.refresh();
      }
    }
  }
  const make = (
    key: string, w: number, h: number,
    draw: (c: CanvasRenderingContext2D) => void,
  ): void => {
    if (scene.textures.exists(key)) return;
    const texture = scene.textures.createCanvas(key, w, h)!;
    texture.context.imageSmoothingEnabled = true;
    texture.context.imageSmoothingQuality = "high";
    draw(texture.context);
    texture.refresh();
  };

  make(ASSET_KEYS.pinosSky, 1280, 853, (c) => drawSky(c, 1280, 853));
  make(ASSET_KEYS.pinosRidges, 900, 500, (c) => drawRidges(c, 900, 500));
  make(ASSET_KEYS.pinosTerrain, 96, 96, (c) => drawMetalTile(c, 96));
  make(ASSET_KEYS.pinosHazard, 96, 14, (c) => drawHazard(c, 96, 14));
  make(ASSET_KEYS.pinosBear, 520, 520, (c) => drawBear(c, 520, 520));
  make(ASSET_KEYS.pinosCrane, 380, 440, (c) => drawCrane(c, 380, 440));
  make(ASSET_KEYS.pinosBanner, 150, 320, (c) => drawBanner(c, 150, 320));
  make(ASSET_KEYS.pinosPlushArt, PLUSH_FRAME.width, PLUSH_FRAME.height, (c) => drawPlush(c, PLUSH_FRAME));
}

/* -------------------------------------------------------------------------- */
/* Scenery                                                                    */
/* -------------------------------------------------------------------------- */

/** Fixed sky plus parallax junkyard skylines and a few hero landmarks. */
export class PinosArt {
  private readonly layers: { images: Phaser.GameObjects.Image[]; width: number; factor: number }[] = [];
  private readonly parallax: { image: Phaser.GameObjects.Image; baseX: number; factor: number }[] = [];

  constructor(private readonly scene: Phaser.Scene) {
    if (scene.textures.exists(ASSET_KEYS.pinosProps)) {
      // Mirrored copies share their edge pixels, avoiding hard panorama seams.
      const width = 1280;
      const images = Array.from({ length: 3 }, () => scene.add.image(0, -80, ASSET_KEYS.pinosSky)
        .setOrigin(0).setDisplaySize(width, width * 1024 / 1536)
        .setScrollFactor(0).setDepth(-100));
      this.layers.push({ images, width, factor: 0.18 });
    } else {
      scene.add.image(0, -108, ASSET_KEYS.pinosSky)
        .setOrigin(0).setDisplaySize(1280, 853).setScrollFactor(0).setDepth(-100);

      // Slow, hazy far structures.
      this.addSkyline(1500, 470, 0.1, -82, 0.42, 0x2b3a3e);
      // Nearer crooked towers.
      this.addSkyline(1220, 560, 0.3, -66, 0.78, 0x1b262a);

      // Warm window/furnace glows spread across the skyline.
      for (let i = 0; i < 16; i++) {
        const x = (i * 173 + 60) % GAME_WIDTH;
        const y = 150 + (i * 61) % 320;
        const win = scene.add.image(x, y, ASSET_KEYS.particle)
          .setTint(i % 5 === 0 ? 0xff7a3c : 0xffb14d)
          .setBlendMode(Phaser.BlendModes.ADD)
          .setScale(0.5 + (i % 3) * 0.25)
          .setScrollFactor(0.16).setDepth(-70).setAlpha(0.35);
        scene.tweens.add({
          targets: win, alpha: 0.7,
          duration: 1400 + i * 220, delay: i * 130, yoyo: true, repeat: -1,
        });
      }

      // Hero landmarks near the landing site: giant plush, salvage crane, banner.
      this.addParallax(ASSET_KEYS.pinosBear, 430, 470, 540, 540, 0.24, -78, 0.92, 0x9a86a0);
      this.addParallax(ASSET_KEYS.pinosCrane, 760, 250, 420, 486, 0.34, -72, 0.9, 0x2a3a3d);
      this.addParallax(ASSET_KEYS.pinosBanner, 1180, 300, 150, 320, 0.42, -64, 0.95, 0xc65a63);

    }

    // Rising embers + a few cold sparks.
    for (let i = 0; i < 24; i++) {
      const x = (i * 151 + 47) % GAME_WIDTH;
      const y = 220 + (i * 97) % 420;
      const ember = i % 4 === 0;
      const mote = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(ember ? 0x57d6e0 : (i % 3 === 0 ? 0xff8a3a : 0xffb861))
        .setBlendMode(Phaser.BlendModes.ADD)
        .setScale(i % 5 === 0 ? 0.3 : 0.14)
        .setScrollFactor(0).setDepth(-80).setAlpha(0.22);
      scene.tweens.add({
        targets: mote, alpha: 0.6, y: y - 30,
        duration: 2400 + i * 130, delay: i * 90, yoyo: true, repeat: -1,
      });
    }
  }

  private addSkyline(width: number, bottom: number, factor: number, depth: number, alpha: number, tint: number): void {
    const images = Array.from({ length: 3 }, () =>
      this.scene.add.image(0, bottom, ASSET_KEYS.pinosRidges)
        .setOrigin(0, 1).setDisplaySize(width, width * 500 / 900)
        .setScrollFactor(0).setDepth(depth).setAlpha(alpha).setTint(tint),
    );
    this.layers.push({ images, width, factor });
  }

  private addParallax(
    key: string, x: number, bottom: number, w: number, h: number,
    factor: number, depth: number, alpha: number, tint: number,
  ): void {
    const image = this.scene.add.image(x, bottom, key)
      .setOrigin(0.5, 1).setDisplaySize(w, h)
      .setScrollFactor(0).setDepth(depth).setAlpha(alpha).setTint(tint);
    this.parallax.push({ image, baseX: x, factor });
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
    for (const p of this.parallax) {
      p.image.x = p.baseX - scrollX * p.factor;
    }
  }
}

/**
 * Worn metal platform: a tiled steel fill, a hazard-striped top lip, big
 * cross-head bolts and (for full-height ground) hanging cables underneath.
 */
export function drawPinosTerrain(scene: Phaser.Scene, cfg: PlatformConfig): void {
  const left = cfg.x - cfg.width / 2;
  const top = cfg.y - cfg.height / 2;
  const ground = cfg.height >= 60;

  if (scene.textures.exists(ASSET_KEYS.pinosProps)) {
    if (ground) {
      const texture = scene.textures.get(ASSET_KEYS.pinosTerrain).getSourceImage();
      const scale = (cfg.height + 28) / texture.height;
      scene.add.tileSprite(left, top, cfg.width, cfg.height + 28, ASSET_KEYS.pinosTerrain)
        .setOrigin(0).setTileScale(scale).setDepth(1);
    } else {
      // Three slices preserve large end bolts at every platform width.
      const texture = scene.textures.get(ASSET_KEYS.pinosProps);
      const frame = texture.get("ledge");
      const cap = 100;
      if (!texture.has("ledge-left")) {
        texture.add("ledge-left", 0, frame.cutX, frame.cutY, cap, frame.cutHeight);
        texture.add("ledge-middle", 0, frame.cutX + cap, frame.cutY, frame.cutWidth - cap * 2, frame.cutHeight);
        texture.add("ledge-right", 0, frame.cutX + frame.cutWidth - cap, frame.cutY, cap, frame.cutHeight);
      }
      const height = cfg.height + 10;
      const endWidth = cap * height / frame.cutHeight;
      scene.add.image(left, top, ASSET_KEYS.pinosProps, "ledge-left").setOrigin(0).setDisplaySize(endWidth, height).setDepth(2);
      scene.add.image(left + endWidth, top, ASSET_KEYS.pinosProps, "ledge-middle").setOrigin(0).setDisplaySize(cfg.width - endWidth * 2, height).setDepth(2);
      scene.add.image(left + cfg.width - endWidth, top, ASSET_KEYS.pinosProps, "ledge-right").setOrigin(0).setDisplaySize(endWidth, height).setDepth(2);
    }
    return;
  }

  // Hanging cables / chains under full-height ground segments.
  if (ground) {
    const under = scene.add.graphics().setDepth(0);
    under.lineStyle(3, 0x161d1f, 1);
    for (let x = left + 60; x < left + cfg.width - 40; x += 150) {
      const sag = 16 + ((x * 7) % 22);
      under.beginPath();
      under.moveTo(x, top + cfg.height - 4);
      under.lineTo(x + 24, top + cfg.height + sag);
      under.lineTo(x + 52, top + cfg.height - 2);
      under.strokePath();
    }
  }

  const fill = scene.add.tileSprite(left, top, cfg.width, cfg.height + 6, ASSET_KEYS.pinosTerrain)
    .setOrigin(0, 0).setDepth(1);
  fill.setTileScale(0.62, 0.62);

  // Panel seams.
  const edge = scene.add.graphics().setDepth(2);
  edge.lineStyle(1.5, 0x11191b, 0.55);
  for (let x = left + 118; x < left + cfg.width - 20; x += 118) {
    edge.lineBetween(x, top + 2, x, top + cfg.height);
  }

  // Bright top lip + hazard stripe.
  edge.fillStyle(0x64858a, 1).fillRect(left, top - 3, cfg.width, 3);
  edge.fillStyle(0xa6dede, 0.5).fillRect(left, top - 3, cfg.width, 1.4);
  const hazard = scene.add.tileSprite(left, top, cfg.width, ground ? 12 : 9, ASSET_KEYS.pinosHazard)
    .setOrigin(0, 0).setDepth(3).setAlpha(0.92);
  hazard.setTileScale(ground ? 0.85 : 0.62, ground ? 0.85 : 0.62);
  edge.lineStyle(1, 0x0e1616, 0.6).strokeRect(left, top, cfg.width, cfg.height);

  // Corner cross-bolts + a spaced row along the deck.
  const corners = scene.add.graphics().setDepth(4);
  const cross = (x: number, y: number, r: number): void => {
    corners.fillStyle(0x9aa6a6, 1).fillCircle(x, y, r);
    corners.lineStyle(Math.max(1, r * 0.4), 0x232d2f, 1);
    corners.lineBetween(x - r * 0.7, y, x + r * 0.7, y);
    corners.lineBetween(x, y - r * 0.7, x, y + r * 0.7);
  };
  const inset = ground ? 18 : 12;
  cross(left + inset, top + inset, ground ? 4 : 3);
  cross(left + cfg.width - inset, top + inset, ground ? 4 : 3);
  if (ground) {
    cross(left + inset, top + cfg.height - inset, 4);
    cross(left + cfg.width - inset, top + cfg.height - inset, 4);
  }
  for (let x = left + 46; x < left + cfg.width - 30; x += 64) {
    cross(x, top + (ground ? 22 : 15), 2.4);
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
      g.fillStyle(0x2a3436, 1).fillEllipse(x, y + 4 * scale, 14 * scale, 5 * scale);
      g.fillStyle(0x9aa6a6, 1).fillCircle(x, y, 7 * scale);
      g.fillStyle(0x5c6668, 1).fillCircle(x + 2 * scale, y + 2 * scale, 5 * scale);
      g.lineStyle(2 * scale, 0x232d2f, 1);
      g.lineBetween(x - 6 * scale, y, x + 6 * scale, y);
      g.lineBetween(x, y - 6 * scale, x, y + 6 * scale);
      break;
    case "cable":
      g.lineStyle(4 * scale, 0x11191b, 1);
      g.beginPath();
      g.moveTo(x - 28 * scale, y);
      g.lineTo(x - 8 * scale, y + 16 * scale);
      g.lineTo(x + 8 * scale, y - 8 * scale);
      g.lineTo(x + 28 * scale, y + 12 * scale);
      g.strokePath();
      g.lineStyle(1.5 * scale, 0x39474b, 1);
      g.beginPath();
      g.moveTo(x - 28 * scale, y - 1);
      g.lineTo(x - 8 * scale, y + 15 * scale);
      g.lineTo(x + 8 * scale, y - 9 * scale);
      g.lineTo(x + 28 * scale, y + 11 * scale);
      g.strokePath();
      break;
    case "spring": {
      g.lineStyle(3 * scale, 0xb7c2c2, 1);
      g.beginPath();
      g.moveTo(x - 6 * scale, y);
      for (let i = 1; i <= 9; i++) {
        g.lineTo(x + (i % 2 === 0 ? -6 : 6) * scale, y - i * 5 * scale);
      }
      g.strokePath();
      g.fillStyle(0x8f9a9a, 1).fillCircle(x, y - 47 * scale, 3 * scale);
      break;
    }
    case "toy": {
      // A dropped, half-crushed plush cube.
      g.fillStyle(0x8a4620, 1).fillRoundedRect(x - 13 * scale, y - 11 * scale, 26 * scale, 20 * scale, 6 * scale);
      g.fillStyle(0xb6602e, 1).fillRoundedRect(x - 13 * scale, y - 13 * scale, 26 * scale, 14 * scale, 6 * scale);
      g.fillStyle(0x3f7b74, 1).fillCircle(x - 4 * scale, y - 4 * scale, 4 * scale);
      g.lineStyle(1.5 * scale, 0xfff0dc, 0.7).strokeRoundedRect(x - 13 * scale, y - 13 * scale, 26 * scale, 22 * scale, 6 * scale);
      g.lineStyle(2 * scale, 0x1b1512, 1);
      g.lineBetween(x + 3 * scale, y - 6 * scale, x + 9 * scale, y);
      g.lineBetween(x + 9 * scale, y - 6 * scale, x + 3 * scale, y);
      break;
    }
    case "glow": {
      const light = scene.add.image(x, y, ASSET_KEYS.particle)
        .setTint(0xff8a3a).setBlendMode(Phaser.BlendModes.ADD)
        .setScale(1.7 * scale).setAlpha(0.16).setDepth(-2);
      scene.tweens.add({ targets: light, alpha: 0.42, duration: 1700 + (x % 900), yoyo: true, repeat: -1 });
      g.destroy();
      return;
    }
  }
}

/** Pedro's lander on Pinos: a stubby white capsule with a glowing cyan porthole. */
export function drawPinosSpaceship(scene: Phaser.Scene, x: number, baseY: number): void {
  if (scene.textures.exists(ASSET_KEYS.pinosProps)) {
    const frame = scene.textures.get(ASSET_KEYS.pinosProps).get("rocket");
    scene.add.image(x, baseY, ASSET_KEYS.pinosProps, "rocket")
      .setOrigin(0.5, 1).setDisplaySize(225 * frame.width / frame.height, 225).setDepth(-1);
    return;
  }
  const g = scene.add.graphics().setDepth(-1);

  // Contact shadow.
  g.fillStyle(0x000000, 0.25).fillEllipse(x, baseY - 2, 78, 12);

  // Red fins.
  g.fillStyle(0x8a2f2f, 1);
  g.fillTriangle(x - 26, baseY - 46, x - 60, baseY - 2, x - 8, baseY - 22);
  g.fillTriangle(x + 26, baseY - 46, x + 60, baseY - 2, x + 8, baseY - 22);
  g.fillStyle(0xb03c3c, 1);
  g.fillTriangle(x - 26, baseY - 46, x - 46, baseY - 6, x - 12, baseY - 24);

  // Hull.
  g.fillStyle(0xdfe4e2, 1);
  g.fillRoundedRect(x - 30, baseY - 150, 60, 120, 16);
  g.fillStyle(0xf3f6f4, 1);
  g.fillRoundedRect(x - 30, baseY - 150, 22, 120, 16);
  // Nose cone.
  g.fillStyle(0xc7cecb, 1);
  g.beginPath();
  g.moveTo(x - 30, baseY - 138);
  g.lineTo(x, baseY - 176);
  g.lineTo(x + 30, baseY - 138);
  g.closePath();
  g.fillPath();
  g.fillStyle(0x8a2f2f, 1).fillCircle(x, baseY - 172, 4);

  // Panel seams + rivets.
  g.lineStyle(2, 0xa9b2ae, 1);
  g.lineBetween(x - 30, baseY - 108, x + 30, baseY - 108);
  g.lineBetween(x - 30, baseY - 62, x + 30, baseY - 62);
  g.fillStyle(0xa9b2ae, 1);
  for (let i = 0; i < 5; i++) {
    g.fillCircle(x - 24 + i * 12, baseY - 34, 1.6);
    g.fillCircle(x - 24 + i * 12, baseY - 146, 1.6);
  }

  // Porthole with a metal ring.
  g.fillStyle(0x9aa6a6, 1).fillCircle(x, baseY - 100, 17);
  g.fillStyle(0x0e2b30, 1).fillCircle(x, baseY - 100, 13);
  g.fillStyle(0x232d2f, 1);
  for (let i = 0; i < 6; i++) {
    const a = (i / 6) * Math.PI * 2;
    g.fillCircle(x + Math.cos(a) * 15, baseY - 100 + Math.sin(a) * 15, 1.6);
  }

  // Landing legs + step.
  g.lineStyle(5, 0x8f9a9a, 1);
  g.lineBetween(x - 22, baseY - 34, x - 34, baseY - 2);
  g.lineBetween(x + 22, baseY - 34, x + 34, baseY - 2);
  g.fillStyle(0x8f9a9a, 1).fillRect(x - 8, baseY - 26, 16, 4);

  // Glow from the porthole + a faint idle exhaust.
  const port = scene.add.image(x, baseY - 100, ASSET_KEYS.particle)
    .setTint(0x57d6e0).setBlendMode(Phaser.BlendModes.ADD).setScale(1.5).setAlpha(0.45).setDepth(-1);
  scene.tweens.add({ targets: port, alpha: 0.75, duration: 2000, yoyo: true, repeat: -1 });
  const flame = scene.add.image(x, baseY - 2, ASSET_KEYS.particle)
    .setTint(0xff8a3a).setBlendMode(Phaser.BlendModes.ADD).setScale(2).setAlpha(0.28).setDepth(-1);
  scene.tweens.add({ targets: flame, alpha: 0.5, scaleX: 2.6, duration: 700, yoyo: true, repeat: -1 });
}
