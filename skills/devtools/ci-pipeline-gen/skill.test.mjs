import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/ci-pipeline-gen");
  assert.ok(meta.tags.includes("ci"));
});

test("default github workflow has the canonical shape", () => {
  const { filename, yaml } = run({});
  assert.equal(filename, ".github/workflows/ci.yml");
  assert.match(yaml, /name: CI/);
  assert.match(yaml, /actions\/checkout@v4/);
  assert.match(yaml, /actions\/setup-node@v4/);
  assert.match(yaml, /node-version: \['20\.x', '22\.x'\]/);
  assert.match(yaml, /- run: npm ci/);
  assert.match(yaml, /- run: npm test/);
});

test("custom node versions build the matrix", () => {
  const { yaml } = run({ node: ["18", "20", "22"] });
  assert.match(yaml, /\['18\.x', '20\.x', '22\.x'\]/);
});

test("lint command adds a step before test", () => {
  const { yaml } = run({ lint: "npm run lint", test: "npm test" });
  const lintIdx = yaml.indexOf("npm run lint");
  const testIdx = yaml.indexOf("npm test");
  assert.ok(lintIdx > -1 && lintIdx < testIdx);
});

test("commands with special chars are quoted", () => {
  const { yaml } = run({ test: "node --test && echo done" });
  assert.match(yaml, /- run: 'node --test && echo done'/);
});

test("gitlab platform emits a .gitlab-ci.yml with a matrix", () => {
  const { filename, yaml } = run({ platform: "gitlab", node: ["20", "22"] });
  assert.equal(filename, ".gitlab-ci.yml");
  assert.match(yaml, /NODE: \["20", "22"\]/);
  assert.match(yaml, /image: node:\$NODE/);
});

test("invalid platform and node throw", () => {
  assert.throws(() => run({ platform: "circleci" }));
  assert.throws(() => run({ node: [] }));
  assert.throws(() => run({ node: ["latest"] }));
});

test("empty install/test throw", () => {
  assert.throws(() => run({ install: "" }));
  assert.throws(() => run({ test: "  " }));
});
