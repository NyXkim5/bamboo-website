// Skill: devtools/test-scaffold
// Parse a JS/TS function signature and emit a node:test stub with placeholders
// for each parameter and a happy-path + edge-case skeleton. Pure + deterministic.

export const meta = {
  id: "devtools/test-scaffold",
  name: "Test Scaffold Generator",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Parse a function signature (function/const arrow/method) and generate a node:test skeleton with a case per parameter plus edge-case stubs.",
  tags: ["devtools", "testing", "codegen", "scaffold", "ci"],
  inputs: { signature: "a JS/TS function declaration or signature string", importPath: "module path (default './module.mjs')" },
  outputs: "{ name, params: string[], test: string }",
  license: "MIT",
  source: "Original implementation; simple signature parsing.",
};

function parseSignature(sig) {
  const s = sig.trim();
  // function foo(a, b) | export function foo(a,b) | async function foo(a)
  let m = /(?:export\s+)?(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/.exec(s);
  // const foo = (a, b) => | export const foo = async (a) =>
  if (!m) m = /(?:export\s+)?const\s+([A-Za-z_$][\w$]*)\s*=\s*(?:async\s*)?\(([^)]*)\)\s*=>/.exec(s);
  // method form: foo(a, b) {
  if (!m) m = /^([A-Za-z_$][\w$]*)\s*\(([^)]*)\)/.exec(s);
  if (!m) throw new Error("could not parse a function name from the signature");

  const name = m[1];
  const params = m[2]
    .split(",")
    .map((p) => p.trim().split(/[:=]/)[0].trim().replace(/^\.\.\./, ""))
    .filter(Boolean);
  return { name, params };
}

export function run(input = {}) {
  const { signature = "", importPath = "./module.mjs" } = input;
  const { name, params } = parseSignature(signature);

  const argList = params.map((p) => `/* ${p} */ undefined`).join(", ");
  const paramCases = params
    .map(
      (p) => `
test("${name}: handles ${p}", () => {
  const result = ${name}(${argList});
  assert.ok(result !== undefined); // TODO: assert on ${p}
});`
    )
    .join("\n");

  const test = `import { test } from "node:test";
import assert from "node:assert/strict";
import { ${name} } from "${importPath}";

test("${name}: happy path", () => {
  const result = ${name}(${argList});
  assert.ok(result !== undefined); // TODO: real expectation
});
${paramCases}

test("${name}: edge cases", () => {
  // TODO: empty / boundary / invalid inputs
  assert.ok(true);
});
`;

  return { name, params, test };
}
