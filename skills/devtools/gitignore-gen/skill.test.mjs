import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "devtools/gitignore-gen");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: single stack produces a section", () => {
  const out = run({ stacks: ["node"] });
  assert.deepEqual(out.unknown, []);
  assert.ok(out.content.startsWith("# node\n"));
  assert.ok(out.content.includes("node_modules/"));
  assert.ok(out.content.endsWith("\n"));
});

test("happy path: multiple stacks in order with sections", () => {
  const out = run({ stacks: ["python", "macos"] });
  assert.deepEqual(out.unknown, []);
  const pyIdx = out.content.indexOf("# python");
  const macIdx = out.content.indexOf("# macos");
  assert.ok(pyIdx !== -1 && macIdx !== -1 && pyIdx < macIdx);
  assert.ok(out.content.includes("__pycache__/"));
  assert.ok(out.content.includes(".DS_Store"));
  // sections separated by a blank line
  assert.ok(out.content.includes("\n\n# macos\n"));
});

test("unknown stacks are reported, known ones still included", () => {
  const out = run({ stacks: ["rust", "cobol", "fortran"] });
  assert.deepEqual(out.unknown, ["cobol", "fortran"]);
  assert.ok(out.content.includes("# rust"));
  assert.ok(out.content.includes("target/"));
});

test("case-insensitive and duplicates deduped", () => {
  const out = run({ stacks: ["Node", "NODE", "node"] });
  assert.deepEqual(out.unknown, []);
  const matches = out.content.match(/# node/g);
  assert.equal(matches.length, 1);
});

test("edge case: empty stacks array yields empty content", () => {
  const out = run({ stacks: [] });
  assert.deepEqual(out, { content: "", unknown: [] });
});

test("throws when stacks is not an array", () => {
  assert.throws(() => run({ stacks: "node" }), /stacks must be an array/);
  assert.throws(() => run({}), /stacks must be an array/);
  assert.throws(() => run(null), /input must be an object/);
});

test("throws when stacks contains non-strings", () => {
  assert.throws(() => run({ stacks: ["node", 42] }), /only strings/);
});

test("edge case: prototype-chain keys are unknown, not a crash", () => {
  const out = run({
    stacks: ["constructor", "toString", "hasOwnProperty", "__proto__"],
  });
  assert.deepEqual(out.unknown, [
    "constructor",
    "toString",
    "hasOwnProperty",
    "__proto__",
  ]);
  assert.equal(out.content, "");
});

test("edge case: surrounding whitespace is trimmed before matching", () => {
  const out = run({ stacks: ["  Node  ", "\tpython\n"] });
  assert.deepEqual(out.unknown, []);
  assert.ok(out.content.includes("# node\n"));
  assert.ok(out.content.includes("# python\n"));
});

test("edge case: empty and whitespace-only strings go to unknown once", () => {
  const out = run({ stacks: ["", "   ", "node"] });
  assert.deepEqual(out.unknown, [""]);
  assert.ok(out.content.includes("# node"));
});

test("unknown stacks are deduped case-insensitively, first spelling kept", () => {
  const out = run({ stacks: ["Cobol", "COBOL", "cobol"] });
  assert.deepEqual(out.unknown, ["Cobol"]);
  assert.equal(out.content, "");
});

test("determinism: identical input yields identical output", () => {
  const input = { stacks: ["rust", "vscode", "nope"] };
  assert.deepEqual(run(input), run(input));
});
