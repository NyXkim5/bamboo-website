export const meta = {
  id: "research/hashtag-extract",
  name: "Hashtag & Mention Extractor",
  domain: "research",
  version: "0.1.0",
  description:
    "Extracts #hashtags, @mentions, and URLs from free text. Hashtags and mentions are returned lowercased and deduplicated in order of first appearance; URLs are returned as-is (deduplicated).",
  tags: ["hashtags", "mentions", "urls", "social-media", "text-extraction", "parsing"],
  license: "MIT",
  inputs: {
    text: "string — the text to scan for #hashtags, @mentions, and http(s) URLs",
  },
  outputs:
    "{ hashtags: string[], mentions: string[], urls: string[] } — hashtags/mentions lowercased+deduped (no leading #/@), urls as-is deduped",
  source: "Original implementation for SkillForge; regex-based tokenizer written from scratch.",
};

const URL_RE = /https?:\/\/[^\s<>"')\]]+/gi;
// Trailing punctuation that is almost certainly sentence punctuation, not part of the URL.
const TRAILING_PUNCT_RE = /[.,;:!?'"]+$/;
// A URL reduced to a bare scheme after punctuation stripping (e.g. from "http://.") is not a URL.
const BARE_SCHEME_RE = /^https?:\/\/$/i;
// A tag/mention must be preceded by start-of-string or a non-letter/digit/underscore
// (Unicode-aware) that is not #/@, so we skip emails (user@host) and mid-word
// markers (foo#bar, café#tag). Note "." IS a valid preceder: the ".@user" convention.
// Hashtags may contain Unicode letters/digits (#café, #日本語); mention names stay
// ASCII [A-Za-z0-9_] to match real-world username rules.
const HASHTAG_RE = /(^|[^\p{L}\p{N}_#@])#([\p{L}\p{N}_]+)/gu;
const MENTION_RE = /(^|[^\p{L}\p{N}_#@])@([A-Za-z0-9_]+)/gu;

function dedupe(list) {
  const seen = new Set();
  const out = [];
  for (const item of list) {
    if (!seen.has(item)) {
      seen.add(item);
      out.push(item);
    }
  }
  return out;
}

function collect(re, text) {
  const out = [];
  re.lastIndex = 0;
  let m;
  while ((m = re.exec(text)) !== null) {
    out.push(m[2].toLowerCase());
  }
  return out;
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new TypeError("input must be an object like { text: string }");
  }
  const { text } = input;
  if (typeof text !== "string") {
    throw new TypeError("input.text must be a string");
  }

  // Extract URLs first, then blank them out so their #fragments and
  // path segments are not misread as hashtags/mentions.
  const urls = [];
  URL_RE.lastIndex = 0;
  const stripped = text.replace(URL_RE, (match) => {
    const cleaned = match.replace(TRAILING_PUNCT_RE, "");
    if (!BARE_SCHEME_RE.test(cleaned)) {
      urls.push(cleaned);
    }
    return " ";
  });

  return {
    hashtags: dedupe(collect(HASHTAG_RE, stripped)),
    mentions: dedupe(collect(MENTION_RE, stripped)),
    urls: dedupe(urls),
  };
}
