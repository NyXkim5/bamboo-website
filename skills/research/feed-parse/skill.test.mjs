import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

const RSS = `<?xml version="1.0"?>
<rss version="2.0"><channel>
  <title>Bamboo Blog</title>
  <item>
    <title>Hello &amp; welcome</title>
    <link>https://example.com/1</link>
    <pubDate>Mon, 13 Jul 2026 09:00:00 GMT</pubDate>
    <description><![CDATA[First <b>post</b>]]></description>
    <guid>post-1</guid>
  </item>
  <item>
    <title>Second post</title>
    <link>https://example.com/2</link>
    <description>Another update</description>
  </item>
</channel></rss>`;

const ATOM = `<?xml version="1.0"?>
<feed xmlns="http://www.w3.org/2005/Atom">
  <title>Bamboo Atom</title>
  <entry>
    <title>Atom entry one</title>
    <link rel="alternate" href="https://example.com/a1"/>
    <updated>2026-07-13T09:00:00Z</updated>
    <summary>Summary one</summary>
    <id>urn:1</id>
  </entry>
</feed>`;

test("meta is well-formed", () => {
  assert.equal(meta.id, "research/feed-parse");
  assert.ok(meta.tags.includes("rss"));
});

test("parses RSS 2.0 with title, link, date, guid", () => {
  const r = run({ xml: RSS });
  assert.equal(r.type, "rss");
  assert.equal(r.title, "Bamboo Blog");
  assert.equal(r.items.length, 2);
  assert.equal(r.items[0].title, "Hello & welcome");
  assert.equal(r.items[0].link, "https://example.com/1");
  assert.equal(r.items[0].id, "post-1");
  assert.equal(r.items[0].summary, "First <b>post</b>");
});

test("RSS item without guid falls back to link as id", () => {
  const r = run({ xml: RSS });
  assert.equal(r.items[1].id, "https://example.com/2");
});

test("parses Atom with href link and updated date", () => {
  const r = run({ xml: ATOM });
  assert.equal(r.type, "atom");
  assert.equal(r.title, "Bamboo Atom");
  assert.equal(r.items[0].link, "https://example.com/a1");
  assert.equal(r.items[0].date, "2026-07-13T09:00:00Z");
  assert.equal(r.items[0].id, "urn:1");
});

test("CDATA and entities are decoded", () => {
  const r = run({ xml: RSS });
  assert.ok(!r.items[0].summary.includes("CDATA"));
  assert.ok(r.items[0].title.includes("&"));
});

test("empty or non-feed input throws", () => {
  assert.throws(() => run({ xml: "" }));
  assert.throws(() => run({ xml: "<html><body>not a feed</body></html>" }));
  assert.throws(() => run({}));
});
