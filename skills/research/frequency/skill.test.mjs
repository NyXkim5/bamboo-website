import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape", () => {
  assert.equal(meta.id, "research/frequency");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("basic frequency with hand-computed counts and pct", () => {
  // Tokens: the(3), cat(2), sat(1), on(1), mat(1) -> total 8, unique 5
  const out = run({ text: "The cat sat on the mat. THE CAT!" });
  assert.equal(out.total, 8);
  assert.equal(out.unique, 5);
  assert.deepEqual(out.top[0], { word: "the", count: 3, pct: 37.5 });
  assert.deepEqual(out.top[1], { word: "cat", count: 2, pct: 25 });
  // Remaining three each 1/8 = 12.5%
  const rest = out.top.slice(2);
  assert.equal(rest.length, 3);
  for (const e of rest) {
    assert.equal(e.count, 1);
    assert.equal(e.pct, 12.5);
  }
  assert.deepEqual(
    rest.map((e) => e.word).sort(),
    ["mat", "on", "sat"]
  );
});

test("top limits number of results and sorts descending", () => {
  // a a a b b c -> total 6, unique 3
  const out = run({ text: "a a a b b c", top: 2 });
  assert.equal(out.total, 6);
  assert.equal(out.unique, 3);
  assert.equal(out.top.length, 2);
  assert.deepEqual(out.top[0], { word: "a", count: 3, pct: 50 });
  assert.deepEqual(out.top[1], { word: "b", count: 2, pct: 33.33 });
});

test("minLength filters short tokens", () => {
  // minLength 3: tokens "foo","barbaz","foo" -> total 3, unique 2
  const out = run({ text: "a is foo barbaz to foo", minLength: 3 });
  assert.equal(out.total, 3);
  assert.equal(out.unique, 2);
  assert.deepEqual(out.top[0], { word: "foo", count: 2, pct: 66.67 });
  assert.deepEqual(out.top[1], { word: "barbaz", count: 1, pct: 33.33 });
});

test("alphanumeric tokenization keeps digits, splits on punctuation", () => {
  // tokens: "abc123", "def", "456" -> total 3, unique 3
  const out = run({ text: "abc123-def,456!!" });
  assert.equal(out.total, 3);
  assert.equal(out.unique, 3);
  const words = out.top.map((e) => e.word).sort();
  assert.deepEqual(words, ["456", "abc123", "def"]);
  for (const e of out.top) assert.equal(e.pct, 33.33);
});

test("empty text returns zeros and empty top", () => {
  assert.deepEqual(run({ text: "" }), { total: 0, unique: 0, top: [] });
  assert.deepEqual(run({ text: "!!! --- ..." }), { total: 0, unique: 0, top: [] });
});

test("default top is 10", () => {
  const words = Array.from({ length: 15 }, (_, i) => `w${i}`).join(" ");
  const out = run({ text: words });
  assert.equal(out.total, 15);
  assert.equal(out.unique, 15);
  assert.equal(out.top.length, 10);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("hello"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ text: 42 }), Error);
  assert.throws(() => run({ text: "hi", top: -1 }), Error);
  assert.throws(() => run({ text: "hi", top: 1.5 }), Error);
  assert.throws(() => run({ text: "hi", minLength: 0 }), Error);
  assert.throws(() => run({ text: "hi", minLength: "2" }), Error);
});

test("negative zero and zero top return empty top; zero-division never occurs", () => {
  // top: -0 must behave exactly like top: 0 (slice(0, -0) === slice(0, 0))
  assert.deepEqual(run({ text: "a b c", top: -0 }), { total: 3, unique: 3, top: [] });
  assert.deepEqual(run({ text: "a b", top: 0 }), { total: 2, unique: 2, top: [] });
  // total === 0: pct math is never reached, so no 0/0 NaN can leak out
  assert.deepEqual(run({ text: "éü 中文 --" }), { total: 0, unique: 0, top: [] });
});

test("non-finite top/minLength throw", () => {
  for (const v of [Infinity, -Infinity, NaN]) {
    assert.throws(() => run({ text: "a", top: v }), Error);
    assert.throws(() => run({ text: "a", minLength: v }), Error);
  }
  // -0 is < 1 for minLength and must throw
  assert.throws(() => run({ text: "a", minLength: -0 }), Error);
});

test("prototype-key words are counted correctly (Map, not object)", () => {
  const out = run({ text: "constructor constructor toString hasOwnProperty proto" });
  assert.equal(out.total, 5);
  assert.equal(out.unique, 4);
  assert.deepEqual(out.top[0], { word: "constructor", count: 2, pct: 40 });
  const singles = out.top.slice(1).map((e) => e.word);
  assert.deepEqual(singles, ["hasownproperty", "proto", "tostring"]);
  for (const e of out.top.slice(1)) assert.equal(e.pct, 20);
});

test("single word is 100 pct; top larger than unique returns all entries", () => {
  assert.deepEqual(run({ text: "hello" }), {
    total: 1,
    unique: 1,
    top: [{ word: "hello", count: 1, pct: 100 }]
  });
  const out = run({ text: "x y", top: 99 });
  assert.equal(out.top.length, 2);
  assert.deepEqual(out.top, [
    { word: "x", count: 1, pct: 50 },
    { word: "y", count: 1, pct: 50 }
  ]);
});

test("determinism: same input gives identical output", () => {
  const input = { text: "b a b c a b", top: 3 };
  assert.deepEqual(run(input), run(input));
  // b(3) a(2) c(1), total 6
  const out = run(input);
  assert.deepEqual(out.top, [
    { word: "b", count: 3, pct: 50 },
    { word: "a", count: 2, pct: 33.33 },
    { word: "c", count: 1, pct: 16.67 }
  ]);
});
