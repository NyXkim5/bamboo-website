// Tests for devtools/diff-summary
import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const MULTI_FILE_DIFF = [
  "diff --git a/src/a.js b/src/a.js",
  "index 1111111..2222222 100644",
  "--- a/src/a.js",
  "+++ b/src/a.js",
  "@@ -1,3 +1,4 @@",
  " line1",
  "-old",
  "+new",
  "+added",
  " line3",
  "diff --git a/new.txt b/new.txt",
  "new file mode 100644",
  "--- /dev/null",
  "+++ b/new.txt",
  "@@ -0,0 +1,2 @@",
  "+hello",
  "+world",
  "diff --git a/gone.txt b/gone.txt",
  "deleted file mode 100644",
  "--- a/gone.txt",
  "+++ /dev/null",
  "@@ -1,1 +0,0 @@",
  "-bye",
  "",
].join("\n");

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/diff-summary");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.source, "string");
});

test("happy path: multi-file diff with add, new file, and deleted file", () => {
  const out = run({ diff: MULTI_FILE_DIFF });
  // Hand-computed: a.js has +new/+added (2 adds) and -old (1 del);
  // new.txt has +hello/+world (2 adds); gone.txt has -bye (1 del).
  assert.equal(out.filesChanged, 3);
  assert.equal(out.insertions, 4);
  assert.equal(out.deletions, 2);
  assert.deepEqual(out.files, [
    { path: "src/a.js", adds: 2, dels: 1 },
    { path: "new.txt", adds: 2, dels: 0 },
    { path: "gone.txt", adds: 0, dels: 1 },
  ]);
  assert.equal(out.summary, "3 files changed, 4 insertions(+), 2 deletions(-)");
});

test("header lines (+++/---) are not counted as insertions/deletions", () => {
  const diff = [
    "--- a/x.txt",
    "+++ b/x.txt",
    "@@ -1 +1 @@",
    "-a",
    "+b",
  ].join("\n");
  const out = run({ diff });
  assert.equal(out.insertions, 1);
  assert.equal(out.deletions, 1);
  assert.equal(out.filesChanged, 1);
  assert.equal(out.files[0].path, "x.txt");
});

test("singular wording in summary", () => {
  const diff = [
    "--- a/one.txt",
    "+++ b/one.txt",
    "@@ -1 +1 @@",
    "-x",
    "+y",
  ].join("\n");
  const out = run({ diff });
  assert.equal(out.summary, "1 file changed, 1 insertion(+), 1 deletion(-)");
});

test("empty diff yields zeros", () => {
  const out = run({ diff: "" });
  assert.deepEqual(out, {
    filesChanged: 0,
    insertions: 0,
    deletions: 0,
    files: [],
    summary: "0 files changed, 0 insertions(+), 0 deletions(-)",
  });
});

test("deleted file takes its path from the --- a/ header", () => {
  const diff = [
    "--- a/removed/file.md",
    "+++ /dev/null",
    "@@ -1,2 +0,0 @@",
    "-one",
    "-two",
  ].join("\n");
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "removed/file.md", adds: 0, dels: 2 }]);
  assert.equal(out.deletions, 2);
  assert.equal(out.insertions, 0);
});

test("classic diff -u headers with timestamps are handled", () => {
  const diff = [
    "--- old.txt\t2026-01-01 00:00:00.000000000 +0000",
    "+++ new.txt\t2026-01-02 00:00:00.000000000 +0000",
    "@@ -1 +1,2 @@",
    " keep",
    "+added",
  ].join("\n");
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "new.txt", adds: 1, dels: 0 }]);
  assert.equal(out.summary, "1 file changed, 1 insertion(+), 0 deletions(-)");
});

test("invalid input throws", () => {
  assert.throws(() => run(null), /object/);
  assert.throws(() => run({}), /'diff' must be a string/);
  assert.throws(() => run({ diff: 42 }), /'diff' must be a string/);
  assert.throws(() => run("not an object"), /object/);
});

test('content lines that look like "---"/"+++" headers inside a hunk are counted, not parsed as headers', () => {
  // Old file line "-- old marker" removed and "++ new marker" added render as
  // "--- old marker" / "+++ new marker" — the @@ counts must disambiguate.
  const diff = [
    "--- a/notes.txt",
    "+++ b/notes.txt",
    "@@ -1,2 +1,2 @@",
    " keep",
    "--- old marker",
    "+++ new marker",
  ].join("\n");
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "notes.txt", adds: 1, dels: 1 }]);
  assert.equal(out.summary, "1 file changed, 1 insertion(+), 1 deletion(-)");
});

test('"\\ No newline at end of file" markers are not counted and consume no hunk lines', () => {
  const diff = [
    "--- a/x.txt",
    "+++ b/x.txt",
    "@@ -1 +1 @@",
    "-old",
    "\\ No newline at end of file",
    "+new",
    "\\ No newline at end of file",
  ].join("\n");
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "x.txt", adds: 1, dels: 1 }]);
});

test("CRLF line endings are tolerated (clean paths and counts)", () => {
  const diff =
    ["--- a/win.txt", "+++ b/win.txt", "@@ -1,2 +1,2 @@", " same", "-old", "+new"].join(
      "\r\n"
    ) + "\r\n";
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "win.txt", adds: 1, dels: 1 }]);
});

test("blank context lines inside a hunk are not counted and hunk tracking stays aligned", () => {
  const diff = [
    "--- a/e.txt",
    "+++ b/e.txt",
    "@@ -1,3 +1,3 @@",
    " a",
    "", // some tools emit truly-empty context lines
    "-b",
    "+c",
    "--- trailer that is NOT part of any file", // after the hunk: ignored preamble-ish line
  ].join("\n");
  const out = run({ diff });
  assert.deepEqual(out.files, [{ path: "e.txt", adds: 1, dels: 1 }]);
  assert.equal(out.filesChanged, 1);
});

test("run is pure: same input gives identical output", () => {
  const a = run({ diff: MULTI_FILE_DIFF });
  const b = run({ diff: MULTI_FILE_DIFF });
  assert.deepEqual(a, b);
  assert.doesNotThrow(() => JSON.stringify(a));
});
