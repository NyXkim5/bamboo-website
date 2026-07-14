import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "design/gradient-gen");
  assert.ok(meta.tags.includes("gradient"));
});

test("endpoints match the requested from/to colors", () => {
  const r = run({ from: "#3b7a57", to: "#f2c14e", stops: 5 });
  assert.equal(r.stops.length, 5);
  assert.equal(r.stops[0], "#3b7a57");
  assert.equal(r.stops[4], "#f2c14e");
});

test("all stops are valid hex", () => {
  const r = run({ from: "#000000", to: "#ffffff", stops: 7 });
  for (const s of r.stops) assert.match(s, /^#[0-9a-f]{6}$/);
});

test("grayscale midpoint is mid-gray", () => {
  const r = run({ from: "#000000", to: "#ffffff", stops: 3 });
  // middle stop should be roughly 50% luminance gray
  const mid = parseInt(r.stops[1].slice(1, 3), 16);
  assert.ok(mid > 110 && mid < 145);
});

test("CSS gradient string is well-formed", () => {
  const r = run({ from: "#3b7a57", to: "#f2c14e", stops: 4, angle: 45 });
  assert.match(r.css, /^linear-gradient\(45deg, /);
  assert.match(r.css, /0%/);
  assert.match(r.css, /100%\)$/);
});

test("stops < 2 throws", () => {
  assert.throws(() => run({ stops: 1 }));
});
