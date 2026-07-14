import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta contract", () => {
  assert.equal(meta.id, "research/cosine-similarity");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.source, "string");
});

test("identical texts give similarity 1", () => {
  const { similarity } = run({ a: "The quick brown fox", b: "the QUICK brown Fox" });
  assert.ok(Math.abs(similarity - 1) < 1e-12);
});

test("hand-computed: 'apple banana' vs 'apple cherry' = 0.5", () => {
  // vectors over {apple, banana, cherry}: a=[1,1,0], b=[1,0,1]
  // dot=1, ||a||=sqrt(2), ||b||=sqrt(2) => 1/2 = 0.5
  const { similarity } = run({ a: "apple banana", b: "apple cherry" });
  assert.ok(Math.abs(similarity - 0.5) < 1e-12);
});

test("hand-computed with repeated terms: 3/sqrt(10)", () => {
  // a = "apple apple banana" -> [2,1]; b = "apple banana" -> [1,1]
  // dot = 2*1 + 1*1 = 3; ||a|| = sqrt(5); ||b|| = sqrt(2)
  // sim = 3 / sqrt(10) = 0.9486832980505138...
  const { similarity } = run({ a: "apple apple banana", b: "apple banana" });
  assert.ok(Math.abs(similarity - 3 / Math.sqrt(10)) < 1e-12);
});

test("no shared vocabulary gives 0", () => {
  const { similarity } = run({ a: "alpha beta", b: "gamma delta" });
  assert.equal(similarity, 0);
});

test("empty edge cases: both empty = 1, one empty = 0", () => {
  assert.equal(run({ a: "", b: "" }).similarity, 1);
  assert.equal(run({ a: "", b: "hello world" }).similarity, 0);
  assert.equal(run({ a: "hello world", b: "" }).similarity, 0);
  // texts with only single-char tokens are effectively empty
  assert.equal(run({ a: "a b c", b: "x y z" }).similarity, 1);
});

test("tokenizer drops tokens shorter than 2 and non-alnum", () => {
  // "a cd!" -> ["cd"], "CD, e" -> ["cd"] => identical single-term vectors => 1
  const { similarity } = run({ a: "a cd!", b: "CD, e" });
  assert.ok(Math.abs(similarity - 1) < 1e-12);
});

test("invalid input throws", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("not an object"), Error);
  assert.throws(() => run({ a: 42, b: "ok" }), Error);
  assert.throws(() => run({ a: "ok" }), Error);
  assert.throws(() => run({ a: "ok", b: ["nope"] }), Error);
});

test("prototype-key tokens are counted correctly: 2/sqrt(10)", () => {
  // Tokens colliding with Object.prototype members must behave as plain terms.
  // a = "constructor constructor toString" -> { constructor: 2, tostring: 1 }
  // b = "constructor hasOwnProperty"       -> { constructor: 1, hasownproperty: 1 }
  // dot = 2*1 = 2; ||a|| = sqrt(5); ||b|| = sqrt(2) => 2/sqrt(10)
  const { similarity } = run({
    a: "constructor constructor toString",
    b: "constructor hasOwnProperty",
  });
  assert.ok(Math.abs(similarity - 2 / Math.sqrt(10)) < 1e-12);
});

test("zero similarity is exactly +0, never -0 or NaN", () => {
  const { similarity } = run({ a: "alpha beta", b: "gamma delta" });
  assert.ok(Object.is(similarity, 0), "expected +0, got " + Object.is(similarity, -0));
});

test("digit runs shorter than 2 are dropped; longer numeric tokens kept", () => {
  // "2.0" splits into "2" and "0" (both length 1, dropped); "10" is kept.
  assert.equal(run({ a: "version 2.0", b: "release 3.1" }).similarity, 0);
  const { similarity } = run({ a: "top 10 list", b: "10 best" });
  assert.ok(similarity > 0); // shares token "10"
});

test("boxed String and other non-primitive-string fields throw", () => {
  assert.throws(() => run({ a: new String("hello"), b: "hello" }), Error);
  assert.throws(() => run({ a: "hello", b: { toString: () => "hello" } }), Error);
});

test("similarity is symmetric and within [0,1]", () => {
  const s1 = run({ a: "red green blue", b: "blue yellow red red" }).similarity;
  const s2 = run({ a: "blue yellow red red", b: "red green blue" }).similarity;
  assert.equal(s1, s2);
  assert.ok(s1 >= 0 && s1 <= 1);
});
