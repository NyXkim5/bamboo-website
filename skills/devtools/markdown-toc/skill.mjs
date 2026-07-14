export const meta = {
  id: "devtools/markdown-toc",
  name: "Markdown TOC Generator",
  domain: "devtools",
  version: "0.1.1",
  description:
    "Generates a table of contents from markdown ATX headings (# ... ######), allowing the CommonMark 0-3 leading spaces. Skips headings inside ``` or ~~~ fenced code blocks. Builds GitHub-style slug anchors (lowercase, spaces to hyphens, strip non-alphanumeric except hyphens) with -1/-2 suffixes for duplicates, guaranteed collision-free against previously emitted slugs. Respects maxDepth (default 3). Returns the TOC entries and a rendered markdown list indented by (level - 1) * 2 spaces.",
  tags: ["markdown", "toc", "table-of-contents", "headings", "slug", "docs"],
  license: "MIT",
  inputs: {
    markdown: "string (required) — the markdown document to scan",
    maxDepth:
      "integer 1-6 (optional, default 3) — include headings up to this level",
  },
  outputs:
    "{ toc: Array<{ level: number, text: string, slug: string }>, markdown: string } — toc entries in document order and a markdown bullet list of anchor links",
  source:
    "Original implementation; slug scheme modeled on the commonly documented GitHub heading-anchor convention.",
};

function slugify(text) {
  return text
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "");
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object");
  }
  const { markdown, maxDepth = 3 } = input;
  if (typeof markdown !== "string") {
    throw new TypeError("input.markdown must be a string");
  }
  if (
    typeof maxDepth !== "number" ||
    !Number.isInteger(maxDepth) ||
    maxDepth < 1 ||
    maxDepth > 6
  ) {
    throw new RangeError("input.maxDepth must be an integer between 1 and 6");
  }

  const lines = markdown.split(/\r\n|\r|\n/);
  const toc = [];
  // Map/Set (not plain objects) so heading texts like "constructor" or
  // "__proto__" can never collide with prototype machinery.
  const slugCounts = new Map();
  const usedSlugs = new Set();
  // null = not in a fence; otherwise the fence character ("`" or "~") that
  // opened the current block, so a ``` line inside a ~~~ block (or vice
  // versa) is treated as content, not as a closing fence.
  let fenceChar = null;

  for (const line of lines) {
    // CommonMark: fences and ATX headings may be indented up to 3 spaces;
    // 4+ spaces is an indented code block.
    const fence = /^ {0,3}(`{3,}|~{3,})/.exec(line);
    if (fence) {
      const ch = fence[1][0];
      if (fenceChar === null) fenceChar = ch;
      else if (ch === fenceChar) fenceChar = null;
      continue;
    }
    if (fenceChar !== null) continue;

    const match = /^ {0,3}(#{1,6})\s+(.*)$/.exec(line);
    if (!match) continue;

    const level = match[1].length;
    if (level > maxDepth) continue;

    // Strip optional trailing closing hashes ("## Title ##" -> "Title").
    let text = match[2].replace(/\s+#+\s*$/, "").trim();
    if (text === "") continue;

    const base = slugify(text);
    let count = slugCounts.get(base) ?? 0;
    let slug = count === 0 ? base : base + "-" + count;
    // Guard against cross-base collisions, e.g. "Setup", "Setup 1", "Setup"
    // must yield setup, setup-1, setup-2 (never setup-1 twice).
    while (usedSlugs.has(slug)) {
      count += 1;
      slug = base + "-" + count;
    }
    slugCounts.set(base, count + 1);
    usedSlugs.add(slug);

    toc.push({ level, text, slug });
  }

  const rendered = toc
    .map(
      (entry) =>
        "  ".repeat(entry.level - 1) + "- [" + entry.text + "](#" + entry.slug + ")"
    )
    .join("\n");

  return { toc, markdown: rendered };
}
