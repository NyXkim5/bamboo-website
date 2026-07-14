import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/title-case");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("basic title casing with minor words lowercased mid-title", () => {
  assert.deepEqual(run({ text: "the quick brown fox jumps over the lazy dog" }), {
    result: "The Quick Brown Fox Jumps Over the Lazy Dog",
  });
  assert.deepEqual(run({ text: "a tale of two cities" }), {
    result: "A Tale of Two Cities",
  });
});

test("first and last words always capitalized even if minor", () => {
  assert.deepEqual(run({ text: "something to believe in" }), {
    result: "Something to Believe In",
  });
  assert.deepEqual(run({ text: "the way we were" }), {
    result: "The Way We Were",
  });
});

test("ALL-CAPS acronyms are preserved", () => {
  assert.deepEqual(run({ text: "NASA launches a new rocket for the ISS" }), {
    result: "NASA Launches a New Rocket for the ISS",
  });
  assert.deepEqual(run({ text: "an intro to HTML and CSS" }), {
    result: "An Intro to HTML and CSS",
  });
});

test("minorWords override replaces the default list", () => {
  // "and" is the only minor word now, so "of" gets capitalized.
  assert.deepEqual(
    run({ text: "war and peace of mind", minorWords: ["and"] }),
    { result: "War and Peace Of Mind" }
  );
  // Empty override: every word capitalized.
  assert.deepEqual(run({ text: "the lord of the rings", minorWords: [] }), {
    result: "The Lord Of The Rings",
  });
});

test("punctuation and mixed-case input handled", () => {
  assert.deepEqual(run({ text: "hello, world!" }), {
    result: "Hello, World!",
  });
  assert.deepEqual(run({ text: "tHE rETURN oF tHE kING" }), {
    result: "The Return of the King",
  });
  assert.deepEqual(run({ text: "" }), { result: "" });
  assert.deepEqual(run({ text: "  spaced   out  " }), {
    result: "  Spaced   Out  ",
  });
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run("hello"), /object/);
  assert.throws(() => run({}), /text/);
  assert.throws(() => run({ text: 123 }), /text/);
  assert.throws(() => run({ text: "ok", minorWords: "and" }), /minorWords/);
  assert.throws(() => run({ text: "ok", minorWords: [1, 2] }), /minorWords/);
});
