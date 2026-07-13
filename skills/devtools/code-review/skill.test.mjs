import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/code-review");
  assert.equal(meta.domain, "devtools");
});

test("clean code scores 100 with no findings", () => {
  const { findings, score } = run({ code: "const x = 1;\nexport const y = x + 1;\n" });
  assert.equal(findings.length, 0);
  assert.equal(score, 100);
});

test("flags console.log as low severity", () => {
  const { findings } = run({ code: "console.log('hi')" });
  assert.equal(findings[0].rule, "no-console");
  assert.equal(findings[0].line, 1);
});

test("high-severity findings sort first", () => {
  const code = "console.log(1)\nconst api_key = 'abcdefgh12345'";
  const { findings } = run({ code });
  assert.equal(findings[0].severity, "high");
  assert.equal(findings[0].rule, "hardcoded-secret");
});

test("empty catch and eval are detected", () => {
  const { findings } = run({ code: "try { x() } catch (e) {}\neval('2+2')" });
  const rules = findings.map((f) => f.rule);
  assert.ok(rules.includes("empty-catch"));
  assert.ok(rules.includes("eval"));
});

test("score decreases with severity weight", () => {
  const { score } = run({ code: "eval('x')" }); // high = -10
  assert.equal(score, 90);
});
