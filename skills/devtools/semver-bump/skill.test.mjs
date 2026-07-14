import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/semver-bump");
  assert.ok(meta.tags.includes("semver"));
});

test("a breaking change bumps major and resets minor/patch", () => {
  const r = run({ current: "1.4.2", commits: ["fix", "breaking"] });
  assert.equal(r.next, "2.0.0");
  assert.equal(r.bump, "major");
});

test("a feat bumps minor and resets patch", () => {
  const r = run({ current: "1.4.2", commits: ["fix", "feat"] });
  assert.equal(r.next, "1.5.0");
  assert.equal(r.bump, "minor");
});

test("only fixes bump patch", () => {
  const r = run({ current: "1.4.2", commits: ["fix", "fix"] });
  assert.equal(r.next, "1.4.3");
});

test("explicit level overrides commit inference", () => {
  const r = run({ current: "1.4.2", commits: ["fix"], level: "major" });
  assert.equal(r.next, "2.0.0");
});

test("no commits defaults to a patch", () => {
  const r = run({ current: "0.9.9", commits: [] });
  assert.equal(r.next, "0.9.10");
});

test("bang-suffixed type is treated as breaking", () => {
  const r = run({ current: "3.2.1", commits: ["feat!"] });
  assert.equal(r.next, "4.0.0");
});

test("invalid version throws", () => {
  assert.throws(() => run({ current: "not.a.version" }));
});
