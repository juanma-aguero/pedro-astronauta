import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import { inflateSync } from "node:zlib";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const modules = new Map();
function loadTs(path) {
  const filename = resolve(root, path.endsWith(".ts") ? path : `${path}.ts`);
  if (modules.has(filename)) return modules.get(filename);
  const module = { exports: {} };
  modules.set(filename, module.exports);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), { compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 } }).outputText;
  vm.runInNewContext(output, { module, exports: module.exports, require: p => loadTs(resolve(dirname(filename), p)) }, { filename });
  return module.exports;
}

const manifest = loadTs("src/game/config/artManifest.ts");
const { ASSET_KEYS } = loadTs("src/game/config/assetKeys.ts");
const { keyGreenMatte, opaqueBounds } = loadTs("src/game/art/artPixels.ts");

// Decode the generated non-interlaced RGB/RGBA PNGs without a native dependency.
// This only reads assets; it never modifies or rewrites artwork.
function readPng(filename) {
  const file = readFileSync(filename);
  assert.equal(file.subarray(1, 4).toString(), "PNG");
  const width = file.readUInt32BE(16), height = file.readUInt32BE(20);
  assert.equal(file[24], 8, "8-bit artwork");
  assert.equal(file[28], 0, "non-interlaced artwork");
  const channels = file[25] === 6 ? 4 : file[25] === 2 ? 3 : 0;
  assert.ok(channels, "RGB or RGBA artwork");
  const chunks = [];
  for (let p = 8; p < file.length;) {
    const length = file.readUInt32BE(p);
    if (file.toString("ascii", p + 4, p + 8) === "IDAT") chunks.push(file.subarray(p + 8, p + 8 + length));
    p += length + 12;
  }
  const raw = inflateSync(Buffer.concat(chunks));
  const stride = width * channels;
  const scan = new Uint8Array(width * height * channels);
  const paeth = (a, b, c) => {
    const p = a + b - c, da = Math.abs(p - a), db = Math.abs(p - b), dc = Math.abs(p - c);
    return da <= db && da <= dc ? a : db <= dc ? b : c;
  };
  for (let y = 0; y < height; y++) {
    const filter = raw[y * (stride + 1)];
    assert.ok(filter <= 4);
    for (let x = 0; x < stride; x++) {
      const i = y * stride + x;
      const left = x >= channels ? scan[i - channels] : 0;
      const up = y > 0 ? scan[i - stride] : 0;
      const corner = y > 0 && x >= channels ? scan[i - stride - channels] : 0;
      const predictor = [0, left, up, Math.floor((left + up) / 2), paeth(left, up, corner)][filter];
      scan[i] = (raw[y * (stride + 1) + x + 1] + predictor) & 255;
    }
  }
  const data = new Uint8ClampedArray(width * height * 4);
  for (let p = 0; p < width * height; p++) {
    data.set(scan.subarray(p * channels, p * channels + 3), p * 4);
    data[p * 4 + 3] = channels === 4 ? scan[p * channels + 3] : 255;
  }
  return { width, height, data };
}

function crop(image, x, y, width, height) {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let row = 0; row < height; row++) {
    const start = ((y + row) * image.width + x) * 4;
    data.set(image.data.subarray(start, start + width * 4), row * width * 4);
  }
  return data;
}

const images = new Map();
for (const source of manifest.ART_SOURCES) {
  const image = readPng(resolve(root, "public/assets/satenes", source.file));
  if (source.matte) keyGreenMatte(image.data);
  images.set(source.key, image);
}

test("green matte becomes transparent without erasing suit, skin, gold or worm colors", () => {
  const colors = [[0, 255, 0, 255], [255, 255, 255, 255], [255, 180, 90, 255], [25, 100, 235, 255], [240, 190, 40, 255]];
  const data = new Uint8ClampedArray(colors.flat());
  keyGreenMatte(data);
  assert.equal(data[3], 0);
  for (let i = 1; i < colors.length; i++) assert.deepEqual([...data.slice(i * 4, i * 4 + 4)], colors[i]);
});

test("all production assets decode and matte backgrounds are transparent", () => {
  for (const source of manifest.ART_SOURCES) {
    const image = images.get(source.key);
    assert.ok(image.width >= 1024 && image.height >= 1024, source.file);
    if (source.matte) {
      assert.equal(image.data[3], 0, `${source.file}: corner matte`);
      let remainingGreen = 0;
      for (let p = 0; p < image.data.length; p += 4) {
        if (image.data[p + 3] > 160 && image.data[p + 1] > Math.max(image.data[p], image.data[p + 2]) + 28) remainingGreen++;
      }
      assert.equal(remainingGreen, 0, `${source.file}: no opaque green spill`);
    }
  }
});

test("Pedro's nine poses have clean margins and fit a fixed baseline canvas", () => {
  for (const pose of manifest.PEDRO_POSES) {
    const image = images.get(pose.source);
    const w = Math.floor(image.width / pose.columns), h = Math.floor(image.height / pose.rows);
    const pixels = crop(image, (pose.index % pose.columns) * w, Math.floor(pose.index / pose.columns) * h, w, h);
    const b = opaqueBounds(pixels, w, h);
    assert.ok(b.x > 4 && b.y > 4 && b.x + b.w < w - 4 && b.y + b.h < h - 4, `${pose.source}:${pose.index} stays inside source cell`);
    assert.ok(b.w * pose.height / b.h < manifest.PLAYER_FRAMES.width - 8, "pose fits output width");
    assert.ok(pose.height < manifest.PLAYER_FRAMES.baseline, "pose fits above baseline");
  }
});

test("worm poses fit the output canvas without clipping", () => {
  const image = images.get("source-worm");
  for (const [i, frame] of manifest.WORM_POSES.entries()) {
    const { x, y, width: w, height: h } = frame;
    const b = opaqueBounds(crop(image, x, y, w, h), w, h);
    assert.ok(b.x > 1 && b.x + b.w < w - 1, `worm frame ${i} source margin: ${JSON.stringify(b)}`);
    assert.ok(b.w * 0.215 < manifest.MONSTER_FRAMES.width - 8);
    assert.ok(b.h * 0.215 < manifest.MONSTER_FRAMES.baseline);
  }
});

test("prop and terrain atlas rectangles are in bounds and contain artwork", () => {
  for (const [key, frames] of [[ASSET_KEYS.props, manifest.PROP_FRAMES], [ASSET_KEYS.terrain, manifest.TERRAIN_FRAMES]]) {
    const image = images.get(key);
    for (const f of frames) {
      assert.ok(f.x >= 0 && f.y >= 0 && f.x + f.width <= image.width && f.y + f.height <= image.height, f.name);
      const b = opaqueBounds(crop(image, f.x, f.y, f.width, f.height), f.width, f.height);
      assert.ok(b.w > f.width / 3 && b.h > f.height / 3, `${f.name} has visible artwork`);
    }
  }
});

test("art pass preserves original collision sizes and gameplay tuning", () => {
  assert.equal(JSON.stringify(manifest.BODY_SIZES), JSON.stringify({ player: { width: 42, height: 58 }, monster: { width: 48, height: 42 }, clue: { width: 48, height: 48 } }));
  const { PLAYER_TUNING } = loadTs("src/game/config/gameplayTuning.ts");
  assert.equal(PLAYER_TUNING.moveSpeed, 260);
  assert.equal(PLAYER_TUNING.jumpVelocity, -650);
  assert.equal(PLAYER_TUNING.maxHealth, 3);
  assert.equal(PLAYER_TUNING.invulnerabilityMs, 1000);
  const { satenesConfig } = loadTs("src/game/planets/satenes/satenesConfig.ts");
  assert.equal(satenesConfig.world.width, 10000);
  assert.equal(satenesConfig.platforms.length, 23);
  assert.equal(satenesConfig.enemies.length, 7);
  for (const p of satenesConfig.platforms) {
    const scale = (p.height >= 60 ? p.height + 4 : p.height + 8) / (p.height >= 60 ? 238 : 164);
    assert.ok(p.width > 256 * scale, "terrain caps leave positive interior width");
  }
});
