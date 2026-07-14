import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape", () => {
  assert.equal(meta.id, "design/hex-normalize");
  assert.equal(meta.domain, "design");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("expands 3-digit shorthand to long form (default form=long)", () => {
  assert.deepEqual(run({ hex: "#abc" }), {
    hex: "#aabbcc",
    canLong: true,
    canShort: true,
  });
  // hand-computed: #F80 -> f80 -> ff8800
  assert.deepEqual(run({ hex: "#F80" }), {
    hex: "#ff8800",
    canLong: true,
    canShort: true,
  });
});

test("shortens doubled-nibble 6-digit hex with form=short", () => {
  // hand-computed: aabbcc -> abc
  assert.deepEqual(run({ hex: "#aabbcc", form: "short" }), {
    hex: "#abc",
    canLong: true,
    canShort: true,
  });
  // hand-computed: 00FF77 -> 0f7
  assert.deepEqual(run({ hex: "00FF77", form: "short" }), {
    hex: "#0f7",
    canLong: true,
    canShort: true,
  });
});

test("auto shortens when possible, otherwise keeps long", () => {
  assert.deepEqual(run({ hex: "#112233", form: "auto" }), {
    hex: "#123",
    canLong: true,
    canShort: true,
  });
  // a1b2c3 has no doubled nibbles -> stays long
  assert.deepEqual(run({ hex: "#A1B2C3", form: "auto" }), {
    hex: "#a1b2c3",
    canLong: true,
    canShort: false,
  });
});

test("long form lowercases and reports canShort correctly", () => {
  assert.deepEqual(run({ hex: "#AABBCC", form: "long" }), {
    hex: "#aabbcc",
    canLong: true,
    canShort: true,
  });
  assert.deepEqual(run({ hex: "#123456", form: "long" }), {
    hex: "#123456",
    canLong: true,
    canShort: false,
  });
});

test("form=short throws when color is not shortenable", () => {
  assert.throws(() => run({ hex: "#123456", form: "short" }), RangeError);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run({}), TypeError); // hex missing
  assert.throws(() => run({ hex: 123 }), TypeError);
  assert.throws(() => run({ hex: "#ab" }), RangeError); // 2 digits
  assert.throws(() => run({ hex: "#abcd" }), RangeError); // 4 digits
  assert.throws(() => run({ hex: "#ggg" }), RangeError); // non-hex chars
  assert.throws(() => run({ hex: "#abc", form: "medium" }), RangeError); // bad form
});

test("edge: empty, bare '#', whitespace, and trailing-newline inputs throw", () => {
  assert.throws(() => run({ hex: "" }), RangeError);
  assert.throws(() => run({ hex: "#" }), RangeError);
  assert.throws(() => run({ hex: " #abc" }), RangeError);
  assert.throws(() => run({ hex: "#abc\n" }), RangeError); // $ must not match before \n
  assert.throws(() => run({ hex: "##abc" }), RangeError);
  assert.throws(() => run({ hex: new String("#abc") }), TypeError); // boxed String rejected
});

test("edge: nibbles that pair only after lowercasing still shorten", () => {
  // hand-computed: #aAbBcC -> lowercase aabbcc -> pairs equal -> abc
  assert.deepEqual(run({ hex: "#aAbBcC", form: "auto" }), {
    hex: "#abc",
    canLong: true,
    canShort: true,
  });
  // hand-computed: #FfFfFf -> ffffff -> fff
  assert.deepEqual(run({ hex: "#FfFfFf", form: "short" }), {
    hex: "#fff",
    canLong: true,
    canShort: true,
  });
});

test("edge: 3-digit input idempotent under short/auto; all-zeros works", () => {
  assert.deepEqual(run({ hex: "#abc", form: "short" }), {
    hex: "#abc",
    canLong: true,
    canShort: true,
  });
  assert.deepEqual(run({ hex: "000", form: "auto" }), {
    hex: "#000",
    canLong: true,
    canShort: true,
  });
  // hand-computed: #000000 -> 000
  assert.deepEqual(run({ hex: "#000000", form: "auto" }), {
    hex: "#000",
    canLong: true,
    canShort: true,
  });
});

test("edge: explicit form=undefined defaults to long; inherited keys are read", () => {
  assert.deepEqual(run({ hex: "#abc", form: undefined }), {
    hex: "#aabbcc",
    canLong: true,
    canShort: true,
  });
  // destructuring reads prototype-inherited properties by design
  assert.deepEqual(run(Object.create({ hex: "#aabbcc", form: "short" })), {
    hex: "#abc",
    canLong: true,
    canShort: true,
  });
});
