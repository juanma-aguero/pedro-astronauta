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

const { NoiseSystem } = loadTs("src/game/mechanics/noise/NoiseSystem.ts");
const { isWithinEarshot } = loadTs("src/game/mechanics/noise/noiseTypes.ts");

const footstep = (x, y) => ({ x, y, kind: "footstep", intensity: 0.45, radius: 300 });

test("isWithinEarshot respects the event radius", () => {
  const e = { ...footstep(0, 0), timestamp: 0 };
  assert.ok(isWithinEarshot(0, 0, e));
  assert.ok(isWithinEarshot(299, 0, e));
  assert.ok(!isWithinEarshot(301, 0, e));
  // Hearing multiplier widens the circle.
  assert.ok(isWithinEarshot(400, 0, e, 1.5));
});

test("emit notifies every listener and returns the timestamped event", () => {
  const sys = new NoiseSystem();
  const heard = [];
  sys.addListener({ onNoise: (ev) => heard.push(ev) });
  const ev = sys.emit(footstep(100, 50), 1000);
  assert.equal(ev.timestamp, 1000);
  assert.equal(heard.length, 1);
  assert.equal(heard[0].x, 100);
});

test("a removed listener stops receiving events", () => {
  const sys = new NoiseSystem();
  const l = { calls: 0, onNoise() { this.calls++; } };
  sys.addListener(l);
  sys.emit(footstep(0, 0), 0);
  sys.removeListener(l);
  sys.emit(footstep(0, 0), 10);
  assert.equal(l.calls, 1);
});

test("the meter jumps to the loudest recent event and then decays to zero", () => {
  const sys = new NoiseSystem();
  sys.emit({ x: 0, y: 0, kind: "landing", intensity: 0.85, radius: 540 }, 0);
  assert.equal(sys.getMeter(), 0.85);
  sys.update(500, 500);
  assert.ok(sys.getMeter() < 0.85 && sys.getMeter() > 0);
  sys.update(5000, 5000);
  assert.equal(sys.getMeter(), 0);
});

test("a louder event overrides a quieter one already on the meter", () => {
  const sys = new NoiseSystem();
  sys.emit(footstep(0, 0), 0); // 0.45
  sys.emit({ x: 0, y: 0, kind: "environment", intensity: 1, radius: 720 }, 5);
  assert.equal(sys.getMeter(), 1);
  assert.equal(sys.getLastEvent().kind, "environment");
});

test("old events are pruned so the recent list never grows without bound", () => {
  const sys = new NoiseSystem();
  for (let i = 0; i < 20; i++) sys.emit(footstep(i, 0), i * 100);
  sys.update(2000, 100);
  assert.ok(sys.getRecentEvents().length > 0);
  sys.update(100000, 100);
  assert.equal(sys.getRecentEvents().length, 0);
});
