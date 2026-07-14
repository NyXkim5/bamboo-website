// Skill: research/feed-parse
// Parse an RSS 2.0 or Atom feed XML *string* into structured items. Pure +
// deterministic — the parser takes the XML directly (no network), so the fetch
// step lives outside this skill and this core stays fully testable offline.
//
// Reference behavior modeled on rss-parser / node-feedparser (both MIT);
// original zero-dependency implementation, no code copied.

export const meta = {
  id: "research/feed-parse",
  name: "RSS / Atom Feed Parser",
  domain: "research",
  version: "0.1.0",
  description:
    "Parse an RSS 2.0 or Atom feed XML string into a normalized { type, title, items:[{title,link,date,summary,id}] } shape. Pure parser core; fetching is a separate concern.",
  tags: ["research", "rss", "atom", "feed", "news", "parser"],
  inputs: { xml: "feed XML as a string" },
  outputs: "{ type: 'rss'|'atom', title, items: [{ title, link, date, summary, id }] }",
  license: "MIT",
  source: "rss-parser / node-feedparser (MIT) behavior as reference; original zero-dep implementation.",
};

// Minimal, forgiving tag extraction (feeds are messy; we avoid a full XML DOM).
function decodeEntities(s) {
  return s
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'").replace(/&apos;/g, "'")
    .replace(/&amp;/g, "&")
    .trim();
}

function firstTag(block, tag) {
  const m = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "i").exec(block);
  return m ? decodeEntities(m[1]) : "";
}

// Atom <link href="..."/> (attribute) vs RSS <link>text</link>.
function atomLink(block) {
  // Prefer rel="alternate"; fall back to the first href.
  const alt = /<link\b[^>]*\brel=["']alternate["'][^>]*\bhref=["']([^"']+)["']/i.exec(block);
  if (alt) return decodeEntities(alt[1]);
  const any = /<link\b[^>]*\bhref=["']([^"']+)["']/i.exec(block);
  return any ? decodeEntities(any[1]) : "";
}

function blocks(xml, tag) {
  const re = new RegExp(`<${tag}\\b[^>]*>([\\s\\S]*?)</${tag}>`, "gi");
  const out = [];
  let m;
  while ((m = re.exec(xml)) !== null) out.push(m[1]);
  return out;
}

export function run(input = {}) {
  const { xml } = input;
  if (typeof xml !== "string" || xml.trim() === "") throw new Error("xml must be a non-empty string");

  const isAtom = /<feed\b[^>]*xmlns=["'][^"']*Atom/i.test(xml) || (/<feed\b/i.test(xml) && /<entry\b/i.test(xml));
  const isRss = /<rss\b/i.test(xml) || /<channel\b/i.test(xml);
  if (!isAtom && !isRss) throw new Error("input does not look like an RSS or Atom feed");

  if (isAtom) {
    const feedTitle = firstTag(xml, "title");
    const items = blocks(xml, "entry").map((b) => ({
      title: firstTag(b, "title"),
      link: atomLink(b),
      date: firstTag(b, "updated") || firstTag(b, "published"),
      summary: firstTag(b, "summary") || firstTag(b, "content"),
      id: firstTag(b, "id"),
    }));
    return { type: "atom", title: feedTitle, items };
  }

  // RSS 2.0
  const channel = blocks(xml, "channel")[0] ?? xml;
  const feedTitle = firstTag(channel.replace(/<item\b[\s\S]*/i, ""), "title");
  const items = blocks(xml, "item").map((b) => ({
    title: firstTag(b, "title"),
    link: firstTag(b, "link"),
    date: firstTag(b, "pubDate") || firstTag(b, "date"),
    summary: firstTag(b, "description"),
    id: firstTag(b, "guid") || firstTag(b, "link"),
  }));
  return { type: "rss", title: feedTitle, items };
}
