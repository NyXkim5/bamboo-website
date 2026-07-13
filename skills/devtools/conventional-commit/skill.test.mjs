import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/conventional-commit");
  assert.equal(meta.domain, "devtools");
});

test("valid feat with scope parses cleanly", () => {
  const r = run({ message: "feat(api): add pagination to list endpoint" });
  assert.ok(r.valid);
  assert.equal(r.type, "feat");
  assert.equal(r.scope, "api");
  assert.equal(r.breaking, false);
});

test("bang marks a breaking change", () => {
  const r = run({ message: "feat!: drop node 16 support" });
  assert.ok(r.valid);
  assert.ok(r.breaking);
});

test("BREAKING CHANGE footer is detected", () => {
  const r = run({ message: "fix: adjust config\n\nBREAKING CHANGE: renamed option" });
  assert.ok(r.breaking);
});

test("unknown type is rejected", () => {
  const r = run({ message: "wibble: do a thing" });
  assert.ok(!r.valid);
  assert.ok(r.errors.some((e) => e.includes("not one of")));
});

test("trailing period and over-length subjects error", () => {
  const long = "feat: " + "x".repeat(100) + ".";
  const r = run({ message: long });
  assert.ok(!r.valid);
  assert.ok(r.errors.some((e) => e.includes("exceeds")));
  assert.ok(r.errors.some((e) => e.includes("period")));
});

test("garbage header is invalid", () => {
  const r = run({ message: "just some words" });
  assert.ok(!r.valid);
});
