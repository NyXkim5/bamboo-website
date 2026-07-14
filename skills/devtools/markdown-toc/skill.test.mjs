import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/markdown-toc");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.1");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("basic headings produce toc entries and indented markdown", () => {
  const md = "# Title\n\nsome text\n\n## Setup\n\n### Details\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 1, text: "Title", slug: "title" },
    { level: 2, text: "Setup", slug: "setup" },
    { level: 3, text: "Details", slug: "details" },
  ]);
  assert.equal(
    result.markdown,
    "- [Title](#title)\n  - [Setup](#setup)\n    - [Details](#details)"
  );
});

test("headings inside fenced code blocks are skipped", () => {
  const md = "# Real\n```js\n# Fake heading in code\n## Another fake\n```\n## After\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 1, text: "Real", slug: "real" },
    { level: 2, text: "After", slug: "after" },
  ]);
  assert.equal(result.markdown, "- [Real](#real)\n  - [After](#after)");
});

test("duplicate heading texts get -1/-2 slug suffixes", () => {
  const md = "# Setup\n## Setup\n### Setup\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 1, text: "Setup", slug: "setup" },
    { level: 2, text: "Setup", slug: "setup-1" },
    { level: 3, text: "Setup", slug: "setup-2" },
  ]);
});

test("maxDepth defaults to 3 and can be customized", () => {
  const md = "# A\n## B\n### C\n#### D\n";
  const byDefault = run({ markdown: md });
  assert.deepEqual(
    byDefault.toc.map((e) => e.text),
    ["A", "B", "C"]
  );
  const depth2 = run({ markdown: md, maxDepth: 2 });
  assert.deepEqual(
    depth2.toc.map((e) => e.text),
    ["A", "B"]
  );
  const depth6 = run({ markdown: md, maxDepth: 6 });
  assert.deepEqual(
    depth6.toc.map((e) => e.text),
    ["A", "B", "C", "D"]
  );
});

test("slugs strip punctuation and non-ascii, keep hyphens", () => {
  const md = "## API & CLI Tools\n### Hello, World!\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 2, text: "API & CLI Tools", slug: "api--cli-tools" },
    { level: 3, text: "Hello, World!", slug: "hello-world" },
  ]);
});

test("trailing closing hashes are stripped; hashes without space are not headings", () => {
  const md = "## Closed Heading ##\n#not-a-heading\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 2, text: "Closed Heading", slug: "closed-heading" },
  ]);
});

test("empty markdown yields empty toc and empty markdown string", () => {
  const result = run({ markdown: "" });
  assert.deepEqual(result.toc, []);
  assert.equal(result.markdown, "");
});

test("dedupe never collides with a slug already taken by another base", () => {
  // Without the used-slug guard, the third heading would also get "setup-1".
  const md = "# Setup\n## Setup 1\n### Setup\n";
  const result = run({ markdown: md });
  assert.deepEqual(
    result.toc.map((e) => e.slug),
    ["setup", "setup-1", "setup-2"]
  );
});

test("prototype-ish heading texts dedupe safely", () => {
  const md = "# constructor\n## constructor\n### __proto__\n";
  const result = run({ markdown: md });
  assert.deepEqual(
    result.toc.map((e) => e.slug),
    ["constructor", "constructor-1", "proto"]
  );
});

test("headings indented up to 3 spaces count; 4+ spaces (indented code) do not", () => {
  const md = "   ## Indented\n    # code block line\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 2, text: "Indented", slug: "indented" },
  ]);
});

test("tilde fences are skipped and backticks inside them do not toggle fence state", () => {
  const md = "~~~\n# hidden\n```\n# still hidden\n~~~\n# visible\n";
  const result = run({ markdown: md });
  assert.deepEqual(result.toc, [
    { level: 1, text: "visible", slug: "visible" },
  ]);
});

test("invalid inputs throw", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run("# hi"), TypeError);
  assert.throws(() => run({}), TypeError);
  assert.throws(() => run({ markdown: 42 }), TypeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: 0 }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: 7 }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: 2.5 }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: "3" }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: NaN }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: Infinity }), RangeError);
  assert.throws(() => run({ markdown: "# hi", maxDepth: -0 }), RangeError);
  assert.throws(() => run([]), TypeError);
});
