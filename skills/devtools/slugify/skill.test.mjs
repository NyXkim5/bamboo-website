// Tests for devtools/slugify
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/slugify");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.ok(typeof meta.source === "string" && meta.source.length > 0);
});

test("happy path: basic sentence", () => {
  assert.deepEqual(run({ text: "Hello, World!" }), { slug: "hello-world" });
  assert.deepEqual(run({ text: "The Quick Brown Fox" }), { slug: "the-quick-brown-fox" });
});

test("accented latin characters are folded to ascii", () => {
  assert.deepEqual(run({ text: "Crème Brûlée à la Française" }), {
    slug: "creme-brulee-a-la-francaise",
  });
  assert.deepEqual(run({ text: "Straße über Köln" }), { slug: "strasse-uber-koln" });
  assert.deepEqual(run({ text: "Señor Ñoño" }), { slug: "senor-nono" });
});

test("runs of non-alphanumerics collapse; leading/trailing trimmed", () => {
  assert.deepEqual(run({ text: "  --Hello***World!!  " }), { slug: "hello-world" });
  assert.deepEqual(run({ text: "a  b\t\nc" }), { slug: "a-b-c" });
});

test("custom separator", () => {
  assert.deepEqual(run({ text: "foo bar baz", options: { separator: "_" } }), {
    slug: "foo_bar_baz",
  });
  assert.deepEqual(run({ text: "foo bar", options: { separator: "" } }), { slug: "foobar" });
});

test("maxLength truncates without dangling separator", () => {
  // "hello-world".slice(0, 8) === "hello-wo"
  assert.deepEqual(run({ text: "hello world", options: { maxLength: 8 } }), {
    slug: "hello-wo",
  });
  // "hello-world".slice(0, 6) === "hello-" -> trailing separator stripped
  assert.deepEqual(run({ text: "hello world", options: { maxLength: 6 } }), { slug: "hello" });
  // shorter than maxLength is untouched
  assert.deepEqual(run({ text: "hi", options: { maxLength: 10 } }), { slug: "hi" });
});

test("edge cases: empty and symbol-only input", () => {
  assert.deepEqual(run({ text: "" }), { slug: "" });
  assert.deepEqual(run({ text: "!!!***???" }), { slug: "" });
  assert.deepEqual(run({ text: "123 456" }), { slug: "123-456" });
});

test("hardening: alphanumeric separator never dangles after truncation", () => {
  // Without maxLength the alphanumeric separator is used as-is.
  assert.deepEqual(run({ text: "ab cd", options: { separator: "x" } }), { slug: "abxcd" });
  // Cut lands right after the separator -> separator must be stripped, not kept.
  assert.deepEqual(run({ text: "ab cd", options: { separator: "x", maxLength: 3 } }), {
    slug: "ab",
  });
  // Mixed alphanumeric separator, cut inside it.
  assert.deepEqual(run({ text: "a b", options: { separator: "-x-", maxLength: 3 } }), {
    slug: "a",
  });
});

test("hardening: truncation mid multi-char separator trims to word boundary", () => {
  assert.deepEqual(run({ text: "a b", options: { separator: "--" } }), { slug: "a--b" });
  assert.deepEqual(run({ text: "a b", options: { separator: "--", maxLength: 2 } }), {
    slug: "a",
  });
  assert.deepEqual(run({ text: "a b", options: { separator: "--", maxLength: 4 } }), {
    slug: "a--b",
  });
});

test("hardening: maxLength shorter than the first word keeps a partial word", () => {
  assert.deepEqual(run({ text: "hello", options: { maxLength: 3 } }), { slug: "hel" });
  assert.deepEqual(run({ text: "hello world", options: { separator: "", maxLength: 7 } }), {
    slug: "hellowo",
  });
});

test("hardening: unmapped unicode (emoji, CJK, lone surrogates) is dropped", () => {
  assert.deepEqual(run({ text: "héllo \u{1F30D} wörld — 中文" }), {
    slug: "hello-world",
  });
  assert.deepEqual(run({ text: "\uD800abc" }), { slug: "abc" });
  assert.deepEqual(run({ text: "中文" }), { slug: "" });
});

test("input validation throws with clear messages", () => {
  assert.throws(() => run(undefined), /input must be an object/);
  assert.throws(() => run([]), /input must be an object/);
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({ text: 42 }), /text must be a string/);
  assert.throws(() => run({ text: "ok", options: "nope" }), /options must be an object/);
  assert.throws(() => run({ text: "ok", options: { separator: 7 } }), /separator must be a string/);
  assert.throws(() => run({ text: "ok", options: { maxLength: 0 } }), /maxLength must be a positive integer/);
  assert.throws(() => run({ text: "ok", options: { maxLength: 2.5 } }), /maxLength must be a positive integer/);
});
