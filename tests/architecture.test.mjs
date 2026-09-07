import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { resolve, dirname } from "node:path";
import vm from "node:vm";
import ts from "typescript";

const root = resolve(import.meta.dirname, "..");
const modules = new Map();
function loadTs(path) {
  const filename = resolve(root, path.endsWith(".ts") ? path : `${path}.ts`);
  if (modules.has(filename)) return modules.get(filename);
  const module = { exports: {} };
  modules.set(filename, module.exports);
  const output = ts.transpileModule(readFileSync(filename, "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2020 },
  }).outputText;
  vm.runInNewContext(
    output,
    { module, exports: module.exports, require: (p) => loadTs(resolve(dirname(filename), p)) },
    { filename },
  );
  return module.exports;
}

const registry = loadTs("src/game/planets/worldRegistry.ts");
const navigation = loadTs("src/game/planets/levelNavigation.ts");
const manifest = loadTs("src/game/config/artManifest.ts");
const { satenesConfig } = loadTs("src/game/planets/satenes/satenesConfig.ts");
const { pinosConfig } = loadTs("src/game/planets/pinos/pinosConfig.ts");
const { silencioConfig } = loadTs("src/game/planets/silencio/silencioConfig.ts");

const { WORLD_REGISTRY, getWorld, getLevel, getNextLevel } = registry;

test("world registry contains Satenes, Pinos and Silencio with unique ids", () => {
  const ids = WORLD_REGISTRY.map((w) => w.id);
  assert.ok(ids.includes("satenes"));
  assert.ok(ids.includes("pinos"));
  assert.ok(ids.includes("silencio"));
  assert.equal(new Set(ids).size, ids.length, "world ids are unique");
});

test("every world has at least one level with a non-empty sceneKey and unique level ids", () => {
  for (const world of WORLD_REGISTRY) {
    assert.ok(world.levels.length >= 1, `${world.id} has a level`);
    assert.ok(world.displayName.length > 0);
    assert.ok(world.description.length > 0);
    const levelIds = world.levels.map((l) => l.id);
    assert.equal(new Set(levelIds).size, levelIds.length, `${world.id} level ids unique`);
    for (const level of world.levels) {
      assert.ok(typeof level.sceneKey === "string" && level.sceneKey.length > 0, `${world.id}/${level.id} sceneKey`);
      assert.ok(level.displayName.length > 0);
    }
  }
});

test("each world's Phase 1 remains registered on the expected scene", () => {
  assert.equal(getLevel("satenes", "phase-1").sceneKey, "SatenesScene");
  assert.equal(getLevel("pinos", "phase-1").sceneKey, "PinosScene");
  assert.equal(getLevel("silencio", "phase-1").sceneKey, "SilencioScene");
  assert.equal(getNextLevel("silencio", "phase-1"), undefined);
});

test("registry helpers are data-driven", () => {
  assert.equal(getWorld("satenes").displayName, "SATENES");
  assert.equal(getWorld("nope"), undefined);
  assert.equal(getLevel("pinos", "nope"), undefined);
  // Only one phase per world for now: no next level yet, but the helper works.
  assert.equal(getNextLevel("satenes", "phase-1"), undefined);
  assert.equal(getNextLevel("pinos", "phase-1"), undefined);
});

test("toRunContext builds a context from registry data", () => {
  assert.deepEqual({ ...navigation.toRunContext("pinos", "phase-1") }, {
    worldId: "pinos", levelId: "phase-1", sceneKey: "PinosScene",
  });
  assert.equal(navigation.toRunContext("pinos", "phase-9"), undefined);
  assert.ok(navigation.isLevelRunContext({ worldId: "a", levelId: "b", sceneKey: "c" }));
  assert.ok(!navigation.isLevelRunContext({ worldId: "a" }));
});

test("art sources are planet-independent and Pinos definitions are valid", () => {
  for (const s of manifest.SHARED_ART_SOURCES) {
    assert.ok(s.path.startsWith("assets/common/"), `${s.key} is shared`);
  }
  for (const s of manifest.SATENES_ART_SOURCES) {
    assert.ok(s.path.startsWith("assets/satenes/"), `${s.key} is satenes-owned`);
  }
  for (const [prefix, list] of [["assets/pinos/", manifest.PINOS_ART_SOURCES], ["assets/silencio/", manifest.SILENCIO_ART_SOURCES]]) {
    assert.ok(Array.isArray(list));
    for (const s of list) {
      assert.ok(typeof s.key === "string" && s.key.length > 0);
      assert.ok(s.path.startsWith(prefix), `art lives under ${prefix}`);
      assert.equal(typeof s.matte, "boolean");
    }
  }
  // Loader never assumes a planet folder.
  for (const s of manifest.ART_SOURCES) {
    assert.ok(!s.file, "sources carry an explicit path, not a bare filename");
    assert.ok(s.path && !s.path.startsWith("/"));
  }
});

/** Shared checks applied to every planet's level config. */
function assertLevelConfig(name, cfg) {
  const { world } = cfg;
  assert.ok(world.width > 0 && world.height > 0 && world.voidY > world.height - 1, `${name} world`);
  for (const key of ["playerSpawn", "spaceship", "clue"]) {
    const p = cfg[key];
    assert.ok(p.x >= 0 && p.x <= world.width, `${name} ${key}.x inside world`);
    assert.ok(p.y >= 0 && p.y <= world.height, `${name} ${key}.y inside world`);
  }
  assert.ok(cfg.platforms.length > 0, `${name} has platforms`);
  for (const plat of cfg.platforms) {
    assert.ok(plat.width > 0 && plat.height > 0, `${name} platform dimensions positive`);
    assert.ok(plat.x - plat.width / 2 >= -1 && plat.x + plat.width / 2 <= world.width + 1, `${name} platform within world`);
  }
  // No impossible ground gaps: max flat jump range with default tuning is ~240 px.
  const ground = cfg.platforms
    .filter((p) => p.height >= 60)
    .map((p) => [p.x - p.width / 2, p.x + p.width / 2])
    .sort((a, b) => a[0] - b[0]);
  for (let i = 1; i < ground.length; i++) {
    const gap = ground[i][0] - ground[i - 1][1];
    assert.ok(gap <= 240, `${name} pit before x=${ground[i][0]} is crossable (${gap}px)`);
  }
}

test("Satenes level config is internally valid", () => {
  assertLevelConfig("satenes", satenesConfig);
  assert.equal(satenesConfig.enemies.length, 7);
});

test("Pinos level config is internally valid and comparable in size to Satenes", () => {
  assertLevelConfig("pinos", pinosConfig);
  assert.ok(pinosConfig.world.width >= 9000 && pinosConfig.world.width <= 10500);
  assert.equal(pinosConfig.world.height, 720);
  const elevated = pinosConfig.platforms.filter((p) => p.height < 60);
  assert.ok(elevated.length >= 12 && elevated.length <= 18, `elevated platform count: ${elevated.length}`);
  assert.ok(pinosConfig.enemies.length >= 3, "several Heavy Metal Plushies");
  // Clue sits near the far right.
  assert.ok(pinosConfig.clue.x > pinosConfig.world.width * 0.9);
  // Every plush patrol zone (plus charge overshoot) stays over solid ground.
  const ground = pinosConfig.platforms
    .filter((p) => p.height >= 60)
    .map((p) => [p.x - p.width / 2, p.x + p.width / 2]);
  const onGround = (x) => ground.some(([a, b]) => x >= a && x <= b);
  for (const e of pinosConfig.enemies) {
    const overshoot = e.maxChargeOvershoot ?? 180;
    assert.ok(onGround(e.patrolMinX - overshoot), `plush @${e.x} left charge stays on ground`);
    assert.ok(onGround(e.patrolMaxX + overshoot), `plush @${e.x} right charge stays on ground`);
    assert.ok(e.patrolMinX < e.patrolMaxX && e.chargeSpeed > e.patrolSpeed);
  }
});

test("Silencio level config is valid and its Oscuros/noise traps are well formed", () => {
  assertLevelConfig("silencio", silencioConfig);
  assert.ok(silencioConfig.world.width >= 9000 && silencioConfig.world.width <= 10500);
  assert.equal(silencioConfig.world.height, 720);

  const elevated = silencioConfig.platforms.filter((p) => p.height < 60);
  assert.ok(elevated.length >= 12 && elevated.length <= 18, `elevated platform count: ${elevated.length}`);
  assert.ok(silencioConfig.clue.x > silencioConfig.world.width * 0.9, "clue near the far right");

  const ground = silencioConfig.platforms
    .filter((p) => p.height >= 60)
    .map((p) => [p.x - p.width / 2, p.x + p.width / 2]);
  const onGround = (x) => ground.some(([a, b]) => x >= a && x <= b);

  assert.ok(silencioConfig.enemies.length >= 1, "at least one Oscuro");
  for (const e of silencioConfig.enemies) {
    assert.ok(e.homeMinX < e.homeMaxX, `oscuro @${e.x} home range ordered`);
    assert.ok(e.huntSpeed > e.investigateSpeed, `oscuro @${e.x} hunts faster than it investigates`);
    assert.ok(e.closeAwarenessRange >= 60 && e.closeAwarenessRange <= 120, `oscuro @${e.x} close range is a small safety net`);
    assert.ok(e.searchDurationMs >= 1000 && e.searchDurationMs <= 4000, `oscuro @${e.x} search window`);
    const roam = e.maxChaseDistance ?? 340;
    assert.ok(onGround(e.homeMinX - roam), `oscuro @${e.x} left roam stays on ground`);
    assert.ok(onGround(e.homeMaxX + roam), `oscuro @${e.x} right roam stays on ground`);
  }

  assert.ok(silencioConfig.noiseTraps.length >= 1, "at least one noise trap");
  for (const trap of silencioConfig.noiseTraps) {
    assert.ok(trap.width > 0 && trap.height > 0, "noise trap dimensions positive");
    assert.ok((trap.radius ?? 720) > 0, "noise trap radius positive");
    assert.ok((trap.intensity ?? 1) > 0, "noise trap intensity positive");
    assert.ok(trap.x >= 0 && trap.x <= silencioConfig.world.width, "noise trap inside world");
  }
});
