import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/env-validate");
  assert.ok(meta.tags.includes("env"));
});

test("passes when all required keys are present and valid", () => {
  const r = run({
    env: { API_URL: "https://x.com", PORT: "3000" },
    schema: { API_URL: { type: "url" }, PORT: { type: "number" } },
  });
  assert.ok(r.valid);
  assert.equal(r.checked, 2);
});

test("reports missing required keys by name", () => {
  const r = run({ env: {}, schema: { TOKEN: { required: true } } });
  assert.deepEqual(r.missing, ["TOKEN"]);
  assert.ok(!r.valid);
});

test("optional missing keys do not fail", () => {
  const r = run({ env: {}, schema: { DEBUG: { required: false } } });
  assert.ok(r.valid);
  assert.equal(r.missing.length, 0);
});

test("type mismatch is flagged", () => {
  const r = run({ env: { PORT: "abc" }, schema: { PORT: { type: "number" } } });
  assert.ok(!r.valid);
  assert.equal(r.invalid[0].key, "PORT");
});

test("pattern rule is enforced", () => {
  const r = run({ env: { REGION: "mars" }, schema: { REGION: { pattern: "^(us|eu)-" } } });
  assert.equal(r.invalid[0].reason, "failed pattern");
});

test("never leaks values, only key names", () => {
  const r = run({ env: { SECRET: "supersecret" }, schema: { SECRET: { type: "number" } } });
  const serialized = JSON.stringify(r);
  assert.ok(!serialized.includes("supersecret"));
});
