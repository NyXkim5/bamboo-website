// devtools/diff-summary — Parse a unified diff string and summarize it.
// Counts files changed, insertions (lines starting with "+", excluding the
// "+++" file header) and deletions (lines starting with "-", excluding the
// "---" file header). Reports per-file adds/dels keyed by the "+++ b/<path>"
// header (falling back to the "--- a/<path>" header for deleted files), plus
// a git-style one-line summary such as
// "3 files changed, 12 insertions(+), 4 deletions(-)".

export const meta = {
  id: "devtools/diff-summary",
  name: "Diff Summary",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Parse a unified diff string and report files changed, insertions, deletions, per-file stats, and a git-style one-line summary.",
  tags: ["diff", "git", "unified-diff", "diffstat", "devtools"],
  license: "MIT",
  inputs: {
    diff: "string — unified diff text (as produced by `git diff` / `diff -u`)",
  },
  outputs:
    "{ filesChanged: number, insertions: number, deletions: number, files: [{ path: string, adds: number, dels: number }], summary: string }",
  source:
    "Original implementation of the standard unified diff format (POSIX diff -u / git diff) and git's diffstat --shortstat summary convention; no copied code.",
};

function stripHeaderPath(raw) {
  // "+++ b/src/app.js" -> "src/app.js"; strips optional a/ or b/ prefix
  // and a trailing tab-separated timestamp (classic diff -u output).
  let p = raw.split("\t")[0].trim();
  if (p.startsWith("a/") || p.startsWith("b/")) p = p.slice(2);
  return p;
}

// "@@ -oldStart[,oldCount] +newStart[,newCount] @@" — counts default to 1.
const HUNK_RE = /^@@ -\d+(?:,(\d+))? \+\d+(?:,(\d+))? @@/;

export function run(input) {
  if (input === null || typeof input !== "object") {
    throw new Error("input must be an object with a 'diff' string property");
  }
  const { diff } = input;
  if (typeof diff !== "string") {
    throw new Error("'diff' must be a string");
  }

  const lines = diff.split("\n");
  const files = [];
  let current = null; // per-file accumulator
  let pendingOldPath = null; // from "--- " header, awaiting "+++"
  let remOld = 0; // old-side lines remaining in the current hunk
  let remNew = 0; // new-side lines remaining in the current hunk

  for (let line of lines) {
    if (line.endsWith("\r")) line = line.slice(0, -1); // tolerate CRLF input

    if (current !== null && line.startsWith("@@")) {
      const m = HUNK_RE.exec(line);
      if (m) {
        remOld = m[1] === undefined ? 1 : Number(m[1]);
        remNew = m[2] === undefined ? 1 : Number(m[2]);
      }
      continue; // hunk header
    }

    // Inside a declared hunk every line is content, even ones that look like
    // "--- "/"+++ " file headers (e.g. a removed line "-- x" renders as
    // "--- x" in a diff of a diff). The @@ counts disambiguate, as in git.
    if (current !== null && (remOld > 0 || remNew > 0)) {
      if (line.startsWith("+")) {
        current.adds += 1;
        remNew -= 1;
      } else if (line.startsWith("-")) {
        current.dels += 1;
        remOld -= 1;
      } else if (line.startsWith("\\")) {
        // "\ No newline at end of file" — consumes no hunk lines
      } else {
        remOld -= 1; // context line (a leading space, or blank)
        remNew -= 1;
      }
      continue;
    }

    if (line.startsWith("--- ")) {
      const raw = line.slice(4);
      pendingOldPath = raw.trim() === "/dev/null" ? null : stripHeaderPath(raw);
      continue;
    }
    if (line.startsWith("+++ ")) {
      const raw = line.slice(4);
      const newPath = raw.trim() === "/dev/null" ? null : stripHeaderPath(raw);
      // Prefer the "+++ b/path"; for deleted files (+++ /dev/null) fall back
      // to the "--- a/path" header.
      const path = newPath ?? pendingOldPath ?? "/dev/null";
      current = { path, adds: 0, dels: 0 };
      files.push(current);
      pendingOldPath = null;
      remOld = 0;
      remNew = 0;
      continue;
    }
    if (current === null) continue; // ignore preamble (diff --git, index, mode lines)
    if (line.startsWith("\\")) continue; // no-newline marker outside a hunk
    // Lenient fallback for diffs whose @@ counts are missing or understated.
    if (line.startsWith("+")) {
      current.adds += 1;
    } else if (line.startsWith("-")) {
      current.dels += 1;
    }
  }

  let insertions = 0;
  let deletions = 0;
  for (const f of files) {
    insertions += f.adds;
    deletions += f.dels;
  }
  const filesChanged = files.length;

  const plural = (n, word) => `${n} ${word}${n === 1 ? "" : "s"}`;
  const summary =
    `${plural(filesChanged, "file")} changed, ` +
    `${plural(insertions, "insertion")}(+), ` +
    `${plural(deletions, "deletion")}(-)`;

  return { filesChanged, insertions, deletions, files, summary };
}
