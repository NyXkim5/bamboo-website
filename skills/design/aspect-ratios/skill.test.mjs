import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/aspect-ratios");
  assert.ok(meta.tags.includes("aspect-ratio"));
});

test("1920x1080 reduces to 16:9 widescreen", () => {
  const r = run({ width: 1920, height: 1080 });
  assert.equal(r.ratio, "16:9");
  assert.equal(r.name, "widescreen");
  assert.match(r.css, /aspect-ratio: 16 \/ 9;/);
});

test("square is detected", () => {
  const r = run({ width: 500, height: 500 });
  assert.equal(r.ratio, "1:1");
  assert.equal(r.name, "square");
});

test("solves missing height from a target width", () => {
  const r = run({ width: 16, height: 9, target: { width: 1280 } });
  assert.equal(r.solved.height, 720);
});

test("solves missing width from a target height", () => {
  const r = run({ width: 4, height: 3, target: { height: 300 } });
  assert.equal(r.solved.width, 400);
});

test("uncommon ratio is labelled custom", () => {
  const r = run({ width: 100, height: 37 });
  assert.equal(r.name, "custom");
});

test("non-positive dimensions throw", () => {
  assert.throws(() => run({ width: 0, height: 10 }));
});
