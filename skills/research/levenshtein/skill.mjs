// Levenshtein edit distance skill.
// Computes the minimum number of single-character insertions, deletions,
// and substitutions needed to transform string `a` into string `b`, using
// the classic Wagner-Fischer dynamic programming algorithm with a
// single-row space optimization (O(m*n) time, O(row) space).
// Characters are Unicode code points: astral symbols (e.g. emoji, which
// occupy two UTF-16 code units) count as a single character for both the
// distance and the lengths used in the normalized similarity.
// Also returns a normalized similarity: 1 - distance / max(len(a), len(b)),
// defined as 1 when both strings are empty.

export const meta = {
  id: "research/levenshtein",
  name: "Levenshtein Edit Distance",
  domain: "research",
  version: "0.1.0",
  description:
    "Computes the Levenshtein edit distance between two strings (counted in Unicode code points) and a normalized similarity score (1 - distance / max length).",
  tags: ["string", "edit-distance", "levenshtein", "similarity", "fuzzy-matching"],
  license: "MIT",
  inputs: {
    a: "string — first string",
    b: "string — second string",
  },
  outputs:
    "{ distance: number, similarity: number } — edit distance and normalized similarity in [0, 1]",
  source:
    "Standard Levenshtein distance (V. Levenshtein, 1966) via the Wagner-Fischer dynamic programming algorithm with single-row optimization; original implementation, no copied code.",
};

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object with string properties 'a' and 'b'");
  }
  const { a, b } = input;
  if (typeof a !== "string") {
    throw new Error("input.a must be a string");
  }
  if (typeof b !== "string") {
    throw new Error("input.b must be a string");
  }

  // Work in Unicode code points so astral characters (surrogate pairs in
  // UTF-16, e.g. emoji) count as one character. The fast path keeps plain
  // strings (compared by code unit) when no surrogates are present, which
  // is equivalent for BMP-only text.
  const SURROGATE = /[\uD800-\uDFFF]/;
  let sa = a;
  let sb = b;
  if (SURROGATE.test(a) || SURROGATE.test(b)) {
    sa = Array.from(a);
    sb = Array.from(b);
  }

  const m = sa.length;
  const n = sb.length;

  let distance;
  if (m === 0) {
    distance = n;
  } else if (n === 0) {
    distance = m;
  } else {
    // Single-row DP: row[j] = edit distance between a[0..i) and b[0..j).
    const row = new Array(n + 1);
    for (let j = 0; j <= n; j++) row[j] = j;

    for (let i = 1; i <= m; i++) {
      let prevDiag = row[0]; // row[i-1][j-1]
      row[0] = i;
      const ca = sa[i - 1];
      for (let j = 1; j <= n; j++) {
        const temp = row[j]; // row[i-1][j]
        const substCost = ca === sb[j - 1] ? 0 : 1;
        const del = temp + 1; // deletion from a
        const ins = row[j - 1] + 1; // insertion into a
        const sub = prevDiag + substCost; // substitution (or match)
        row[j] = Math.min(del, ins, sub);
        prevDiag = temp;
      }
    }
    distance = row[n];
  }

  const maxLen = Math.max(m, n);
  const similarity = maxLen === 0 ? 1 : 1 - distance / maxLen;

  return { distance, similarity };
}
