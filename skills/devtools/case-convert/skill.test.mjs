// Tests for devtools/case-convert
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/case-convert");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.source, "string");
});

test("camelCase input to snake, kebab, constant, pascal", () => {
  assert.deepEqual(run({ text: "fooBarBaz", to: "snake" }), {
    result: "foo_bar_baz",
    words: ["foo", "bar", "baz"],
    to: "snake",
  });
  assert.equal(run({ text: "fooBarBaz", to: "kebab" }).result, "foo-bar-baz");
  assert.equal(run({ text: "fooBarBaz", to: "constant" }).result, "FOO_BAR_BAZ");
  assert.equal(run({ text: "fooBarBaz", to: "pascal" }).result, "FooBarBaz");
});

test("snake/kebab/space-separated input to camel and pascal", () => {
  assert.deepEqual(run({ text: "foo_bar_baz", to: "camel" }), {
    result: "fooBarBaz",
    words: ["foo", "bar", "baz"],
    to: "camel",
  });
  assert.equal(run({ text: "foo-bar-baz", to: "pascal" }).result, "FooBarBaz");
  assert.equal(run({ text: "foo bar  baz", to: "camel" }).result, "fooBarBaz");
  assert.equal(run({ text: "FOO_BAR_BAZ", to: "kebab" }).result, "foo-bar-baz");
});

test("acronym and digit boundaries", () => {
  assert.deepEqual(run({ text: "parseHTTPResponse2Xml", to: "snake" }).words, [
    "parse",
    "http",
    "response2",
    "xml",
  ]);
  assert.equal(
    run({ text: "HTTPServer", to: "kebab" }).result,
    "http-server"
  );
});

test("edge cases: single word and empty string", () => {
  assert.deepEqual(run({ text: "hello", to: "pascal" }), {
    result: "Hello",
    words: ["hello"],
    to: "pascal",
  });
  assert.deepEqual(run({ text: "", to: "camel" }), {
    result: "",
    words: [],
    to: "camel",
  });
  assert.equal(run({ text: "already-kebab", to: "kebab" }).result, "already-kebab");
});

test("mixed separators combined", () => {
  assert.equal(
    run({ text: "some_mixedCase-identifier value", to: "constant" }).result,
    "SOME_MIXED_CASE_IDENTIFIER_VALUE"
  );
});

test("greedy acronym splits and digit-interrupted acronyms", () => {
  assert.deepEqual(run({ text: "HTTPSConnection", to: "snake" }), {
    result: "https_connection",
    words: ["https", "connection"],
    to: "snake",
  });
  assert.equal(run({ text: "HTTP2Server", to: "kebab" }).result, "http2-server");
  assert.equal(run({ text: "XMLHttpRequest", to: "snake" }).result, "xml_http_request");
  assert.equal(run({ text: "IOError", to: "kebab" }).result, "io-error");
});

test("separator-only, leading/trailing separators, and single letters", () => {
  assert.deepEqual(run({ text: "___", to: "camel" }), { result: "", words: [], to: "camel" });
  assert.deepEqual(run({ text: "   ", to: "snake" }), { result: "", words: [], to: "snake" });
  assert.equal(run({ text: "__foo--bar  ", to: "camel" }).result, "fooBar");
  assert.equal(run({ text: "A", to: "camel" }).result, "a");
  assert.deepEqual(run({ text: "aB", to: "snake" }).words, ["a", "b"]);
});

test("idempotence: converting output again is a no-op", () => {
  for (const to of ["camel", "pascal", "snake", "kebab", "constant"]) {
    const once = run({ text: "parseHTTPResponse2Xml", to }).result;
    assert.equal(run({ text: once, to }).result, once, `not idempotent for ${to}`);
  }
});

test("prototype-safe inputs", () => {
  // Object.prototype keys are not valid targets (Set lookup, not `in`).
  assert.throws(() => run({ text: "x", to: "__proto__" }), /unknown target case/);
  assert.throws(() => run({ text: "x", to: "constructor" }), /unknown target case/);
  // Symbol `to` must throw cleanly, not crash building the error message.
  assert.throws(() => run({ text: "x", to: Symbol("s") }), /unknown target case/);
  // Null-prototype input objects are accepted.
  const nullProto = Object.create(null);
  nullProto.text = "foo_bar";
  nullProto.to = "camel";
  assert.equal(run(nullProto).result, "fooBar");
});

test("invalid inputs throw", () => {
  assert.throws(() => run([]), /text must be a string/);
  assert.throws(() => run("foo"), /input must be an object/);
  assert.throws(() => run({ text: "foo", to: "title" }), /unknown target case/);
  assert.throws(() => run({ text: "foo", to: 42 }), /unknown target case/);
  assert.throws(() => run({ text: 123, to: "camel" }), /text must be a string/);
  assert.throws(() => run(null), /input must be an object/);
  assert.throws(() => run({ to: "camel" }), /text must be a string/);
});
