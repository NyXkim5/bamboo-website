import { test } from "node:test";
import assert from "node:assert/strict";
import { validateMeta, loadSkills } from "./registry.mjs";

const GOOD = {
  id: "finance/example",
  name: "Example",
  domain: "finance",
  version: "0.1.0",
  description: "does a thing",
  tags: ["finance"],
  license: "MIT",
};

test("a well-formed manifest has no errors (no file → path check skipped)", () => {
  assert.deepEqual(validateMeta(GOOD, null), []);
});

test("missing / empty string fields are flagged", () => {
  assert.ok(validateMeta({ ...GOOD, name: "" }, null).some((e) => e.includes("meta.name")));
  const { license, ...noLicense } = GOOD;
  assert.ok(validateMeta(noLicense, null).some((e) => e.includes("meta.license")));
});

test("tags must be a non-empty string array", () => {
  assert.ok(validateMeta({ ...GOOD, tags: [] }, null).some((e) => e.includes("tags")));
  assert.ok(validateMeta({ ...GOOD, tags: "finance" }, null).some((e) => e.includes("tags")));
});

test("id must be <domain>/<name> kebab", () => {
  assert.ok(validateMeta({ ...GOOD, id: "Finance/Example" }, null).some((e) => e.includes("meta.id")));
  assert.ok(validateMeta({ ...GOOD, id: "nope" }, null).some((e) => e.includes("meta.id")));
});

test("id prefix must match domain", () => {
  assert.ok(validateMeta({ ...GOOD, domain: "design" }, null).some((e) => e.includes("does not match id prefix")));
});

test("version must be semver-like", () => {
  assert.ok(validateMeta({ ...GOOD, version: "one" }, null).some((e) => e.includes("meta.version")));
});

test("all real skills in the repo pass validation and have unique ids", async () => {
  // loadSkills throws if any manifest is invalid or any id is duplicated.
  const skills = await loadSkills();
  assert.ok(skills.length >= 60, `expected >=60 skills, got ${skills.length}`);
  const ids = new Set(skills.map((s) => s.meta.id));
  assert.equal(ids.size, skills.length, "skill ids must be unique");
});
