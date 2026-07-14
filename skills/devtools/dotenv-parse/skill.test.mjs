import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape is valid", () => {
  assert.equal(meta.id, "devtools/dotenv-parse");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("parses simple KEY=VALUE lines with trimming", () => {
  const { env } = run({ text: "FOO=bar\n  BAZ =  qux  \nNUM=42" });
  assert.deepEqual(env, { FOO: "bar", BAZ: "qux", NUM: "42" });
});

test("ignores blank lines and # comments", () => {
  const text = "\n# a comment\nFOO=bar\n\n   # indented comment\nBAR=baz\n";
  const { env } = run({ text });
  assert.deepEqual(env, { FOO: "bar", BAR: "baz" });
});

test("strips surrounding single and double quotes", () => {
  const text = `A="hello world"\nB='single quoted'\nC=" padded "\nD="unterminated`;
  const { env } = run({ text });
  assert.equal(env.A, "hello world");
  assert.equal(env.B, "single quoted");
  assert.equal(env.C, " padded ");
  // Mismatched/unterminated quote is left as-is.
  assert.equal(env.D, '"unterminated');
});

test("supports export prefix", () => {
  const { env } = run({ text: "export FOO=bar\nexport   BAR='baz'" });
  assert.deepEqual(env, { FOO: "bar", BAR: "baz" });
});

test("skips lines without = and empty keys", () => {
  const { env } = run({ text: "JUSTAWORD\nFOO=bar\n=novalue\nexport\n" });
  assert.deepEqual(env, { FOO: "bar" });
  assert.equal(Object.keys(env).length, 1);
});

test("keeps = inside value; only first = splits", () => {
  const { env } = run({ text: "URL=postgres://u:p@h/db?a=1&b=2\nEMPTY=" });
  assert.equal(env.URL, "postgres://u:p@h/db?a=1&b=2");
  assert.equal(env.EMPTY, "");
});

test("handles CRLF and CR line endings", () => {
  const { env } = run({ text: "A=1\r\nB=2\rC=3" });
  assert.deepEqual(env, { A: "1", B: "2", C: "3" });
});

test("prototype-ish keys become own props without polluting", () => {
  const { env } = run({ text: "__proto__=evil\nconstructor=x" });
  assert.ok(Object.prototype.hasOwnProperty.call(env, "__proto__"));
  assert.equal(Object.getOwnPropertyDescriptor(env, "__proto__").value, "evil");
  assert.ok(Object.prototype.hasOwnProperty.call(env, "constructor"));
  assert.equal(
    Object.getOwnPropertyDescriptor(env, "constructor").value,
    "x"
  );
  // Global Object prototype must be untouched.
  assert.equal({}.evil, undefined);
  assert.equal(Object.getPrototypeOf(env), Object.prototype);
});

test("empty and whitespace-only text yield an empty env", () => {
  assert.deepEqual(run({ text: "" }).env, {});
  assert.deepEqual(run({ text: "   \n\t\r\n  " }).env, {});
  assert.equal(Object.keys(run({ text: "" }).env).length, 0);
});

test("duplicate keys: last assignment wins, including __proto__", () => {
  const { env } = run({ text: "A=1\nA=2\n__proto__=a\n__proto__=b" });
  assert.equal(env.A, "2");
  assert.equal(Object.getOwnPropertyDescriptor(env, "__proto__").value, "b");
  assert.equal(Object.getPrototypeOf(env), Object.prototype);
});

test("strips only the outermost quote pair; inner quotes preserved", () => {
  const { env } = run({ text: `A=""x""\nB="'y'"\nC=''\nD="` });
  assert.equal(env.A, '"x"'); // one pair stripped, not two
  assert.equal(env.B, "'y'"); // outer double stripped, inner singles kept
  assert.equal(env.C, ""); // empty quoted value
  assert.equal(env.D, '"'); // lone quote char left as-is
});

test("key literally named 'export' is preserved", () => {
  const { env } = run({ text: "export=keeps\nexport = skippedEmptyKey" });
  assert.deepEqual(env, { export: "keeps" });
});

test("run is pure: repeated calls return independent objects", () => {
  const input = { text: "A=1" };
  const first = run(input);
  first.env.A = "mutated";
  first.env.EXTRA = "x";
  const second = run(input);
  assert.deepEqual(second.env, { A: "1" });
  assert.notEqual(first.env, second.env);
  assert.equal(input.text, "A=1"); // input untouched
});

test("throws on invalid input", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run(undefined), TypeError);
  assert.throws(() => run("FOO=bar"), TypeError);
  assert.throws(() => run({}), TypeError);
  assert.throws(() => run({ text: 42 }), TypeError);
  assert.throws(() => run([]), TypeError);
});
