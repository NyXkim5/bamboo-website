import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/base64");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("encodes hand-computed values (RFC 4648 test vectors)", () => {
  // "Man": M=77 a=97 n=110 -> 010011 010110 000101 101110 -> 19,22,5,46 -> TWFu
  assert.deepEqual(run({ encode: "Man" }), { result: "TWFu" });
  // RFC 4648 section 10 vectors
  assert.deepEqual(run({ encode: "" }), { result: "" });
  assert.deepEqual(run({ encode: "f" }), { result: "Zg==" });
  assert.deepEqual(run({ encode: "fo" }), { result: "Zm8=" });
  assert.deepEqual(run({ encode: "foo" }), { result: "Zm9v" });
  assert.deepEqual(run({ encode: "foob" }), { result: "Zm9vYg==" });
  assert.deepEqual(run({ encode: "fooba" }), { result: "Zm9vYmE=" });
  assert.deepEqual(run({ encode: "foobar" }), { result: "Zm9vYmFy" });
  assert.deepEqual(run({ encode: "hello world" }), { result: "aGVsbG8gd29ybGQ=" });
});

test("encodes full byte range including high Latin-1 bytes", () => {
  // 0x00 0xFF 0x10 -> 00000000 11111111 00010000
  // -> 000000 001111 111100 010000 -> 0,15,60,16 -> A,P,8,Q
  const bytes = String.fromCharCode(0x00, 0xff, 0x10);
  assert.deepEqual(run({ encode: bytes }), { result: "AP8Q" });
  // Single 0xFF byte: 11111111 -> 111111 11(0000) -> 63,48 -> "/","w" plus ==
  assert.deepEqual(run({ encode: "ÿ" }), { result: "/w==" });
});

test("decodes hand-computed values", () => {
  assert.deepEqual(run({ decode: "TWFu" }), { result: "Man" });
  assert.deepEqual(run({ decode: "" }), { result: "" });
  assert.deepEqual(run({ decode: "Zg==" }), { result: "f" });
  assert.deepEqual(run({ decode: "Zm8=" }), { result: "fo" });
  assert.deepEqual(run({ decode: "Zm9vYmFy" }), { result: "foobar" });
  assert.deepEqual(run({ decode: "aGVsbG8gd29ybGQ=" }), { result: "hello world" });
  assert.deepEqual(run({ decode: "AP8Q" }), { result: String.fromCharCode(0x00, 0xff, 0x10) });
  assert.deepEqual(run({ decode: "/w==" }), { result: "ÿ" });
});

test("round-trips every byte value 0-255", () => {
  let all = "";
  for (let i = 0; i < 256; i++) all += String.fromCharCode(i);
  const encoded = run({ encode: all }).result;
  assert.deepEqual(run({ decode: encoded }), { result: all });
});

test("throws on invalid base64 in decode", () => {
  assert.throws(() => run({ decode: "abc" }), /multiple of 4/); // bad length
  assert.throws(() => run({ decode: "Zm9vZg" }), /multiple of 4/); // unpadded
  assert.throws(() => run({ decode: "ab!=" }), /unexpected character/); // bad char
  assert.throws(() => run({ decode: "Zm 9" }), /unexpected character/); // whitespace
  assert.throws(() => run({ decode: "a=bc" }), /trailing padding/); // '=' in middle
  assert.throws(() => run({ decode: "a===" }), /Invalid base64/); // too much padding
});

test("throws on code points above 255 in encode", () => {
  assert.throws(() => run({ encode: "héllo☃" }), /exceeds 255/);
  assert.throws(() => run({ encode: "Ā" }), /exceeds 255/);
});

test("throws on invalid input shapes", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run("hello"), /object/);
  assert.throws(() => run({}), /exactly one/);
  assert.throws(() => run({ encode: "a", decode: "YQ==" }), /exactly one/);
  assert.throws(() => run({ encode: 42 }), /'encode' must be a string/);
  assert.throws(() => run({ decode: 42 }), /'decode' must be a string/);
});

test("enforces canonical base64 (trailing-bit strictness)", () => {
  // "AB==": A=000000 B=000001 -> byte 00000000, leftover 4 bits = 0001 != 0.
  // atob() would accept this; canonical base64 must not.
  assert.throws(() => run({ decode: "AB==" }), /non-zero trailing bits/);
  // "Zm9=": leftover 2 bits = 01 != 0 (canonical form of "fo" is "Zm8=").
  assert.throws(() => run({ decode: "Zm9=" }), /non-zero trailing bits/);
  // All-padding is never valid.
  assert.throws(() => run({ decode: "====" }), /Invalid base64/);
  // "AAA=": leftover 2 bits are zero -> canonical, decodes to \x00\x00.
  assert.deepEqual(run({ decode: "AAA=" }), { result: "\x00\x00" });
});

test("throws on lone surrogates and non-BMP input in encode/decode", () => {
  assert.throws(() => run({ encode: "\uD800" }), /exceeds 255/); // lone high surrogate
  assert.throws(() => run({ encode: "\uDFFF" }), /exceeds 255/); // lone low surrogate
  assert.throws(() => run({ encode: "😀" }), /exceeds 255/);
  // Non-BMP char in decode input: "😀" is 2 UTF-16 units, so "😀==" has
  // length 4 and reaches alphabet validation, not silent garbage.
  assert.throws(() => run({ decode: "😀==" }), /unexpected character/);
  assert.throws(() => run({ decode: "😀A=" }), /unexpected character/);
});

test("prototype and own-property semantics are safe", () => {
  // Inherited 'encode' is not an own property -> rejected.
  assert.throws(() => run(Object.create({ encode: "hi" })), /exactly one/);
  // Arrays are rejected even with an own 'encode' property.
  const arr = [];
  arr.encode = "Man";
  assert.throws(() => run(arr), /object/);
  // Null-prototype input objects (no own hasOwnProperty) still work.
  assert.deepEqual(run({ __proto__: null, encode: "Man" }), { result: "TWFu" });
  // A shadowed hasOwnProperty must not break or fool dispatch.
  assert.deepEqual(run({ hasOwnProperty: null, encode: "f" }), { result: "Zg==" });
  // Decode output containing "constructor"-like text is plain data.
  assert.deepEqual(run({ decode: "Y29uc3RydWN0b3I=" }), { result: "constructor" });
});

test("deterministic long input round-trips across all padding phases", () => {
  // LCG (Numerical Recipes constants) -> reproducible pseudo-random bytes.
  let seed = 123456789;
  const next = () => {
    seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0;
    return seed & 255;
  };
  for (const len of [997, 998, 999]) { // len % 3 = 1, 2, 0
    seed = 123456789 + len;
    let s = "";
    for (let i = 0; i < len; i++) s += String.fromCharCode(next());
    const encoded = run({ encode: s }).result;
    assert.equal(encoded.length, Math.ceil(len / 3) * 4);
    assert.match(encoded, /^[A-Za-z0-9+/]*={0,2}$/);
    assert.deepEqual(run({ decode: encoded }), { result: s });
  }
});
