import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required SkillForge fields", () => {
  assert.equal(meta.id, "research/hashtag-extract");
  assert.equal(meta.domain, "research");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.equal(typeof meta.name, "string");
  assert.equal(typeof meta.description, "string");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("extracts hashtags, mentions, and urls from a tweet-like text", () => {
  const out = run({
    text: "Big news from @Anthropic! #AI #ML read more at https://example.com/post?id=1 #ai",
  });
  assert.deepEqual(out, {
    hashtags: ["ai", "ml"],
    mentions: ["anthropic"],
    urls: ["https://example.com/post?id=1"],
  });
});

test("lowercases and dedupes hashtags/mentions, preserves first-seen order", () => {
  const out = run({ text: "#Foo #BAR #foo @Alice @ALICE @bob #Bar" });
  assert.deepEqual(out.hashtags, ["foo", "bar"]);
  assert.deepEqual(out.mentions, ["alice", "bob"]);
  assert.deepEqual(out.urls, []);
});

test("urls kept as-is (case preserved) and deduped; trailing punctuation stripped", () => {
  const out = run({
    text: "See https://Example.com/Path. Also http://a.b/c, and again https://Example.com/Path",
  });
  assert.deepEqual(out.urls, ["https://Example.com/Path", "http://a.b/c"]);
  assert.deepEqual(out.hashtags, []);
  assert.deepEqual(out.mentions, []);
});

test("does not treat url fragments as hashtags nor emails as mentions", () => {
  const out = run({
    text: "Docs at https://site.io/page#section — email me at user@example.com #real @realuser",
  });
  assert.deepEqual(out.hashtags, ["real"]);
  assert.deepEqual(out.mentions, ["realuser"]);
  assert.deepEqual(out.urls, ["https://site.io/page#section"]);
});

test("empty text and text with no tokens return empty arrays", () => {
  assert.deepEqual(run({ text: "" }), { hashtags: [], mentions: [], urls: [] });
  assert.deepEqual(run({ text: "plain sentence with no markers" }), {
    hashtags: [],
    mentions: [],
    urls: [],
  });
});

test("handles underscores and digits; ignores bare # and @", () => {
  const out = run({ text: "#tag_1 @user_2 # @ ## @@ #2024" });
  assert.deepEqual(out.hashtags, ["tag_1", "2024"]);
  assert.deepEqual(out.mentions, ["user_2"]);
});

test("throws on invalid input", () => {
  assert.throws(() => run(null), TypeError);
  assert.throws(() => run(undefined), TypeError);
  assert.throws(() => run("just a string"), TypeError);
  assert.throws(() => run([]), TypeError);
  assert.throws(() => run({}), TypeError);
  assert.throws(() => run({ text: 42 }), TypeError);
  assert.throws(() => run({ text: null }), TypeError);
});

test('supports the ".@user" public-reply convention while still rejecting emails', () => {
  const out = run({ text: "Great work.@alice — ping user@example.com too" });
  assert.deepEqual(out.mentions, ["alice"]);
});

test("unicode hashtags are extracted whole, never truncated at the first non-ASCII char", () => {
  const out = run({ text: "#Café #日本語 #ÜberFun" });
  assert.deepEqual(out.hashtags, ["café", "日本語", "überfun"]);
});

test("markers glued to a preceding word (including unicode letters) are not tokens", () => {
  const out = run({ text: "price#100 café@home foo#bar" });
  assert.deepEqual(out, { hashtags: [], mentions: [], urls: [] });
});

test("prototype-key tags are handled safely and a bare scheme is not a URL", () => {
  const out = run({ text: "#__proto__ #constructor #__proto__ @__proto__ see http://." });
  assert.deepEqual(out.hashtags, ["__proto__", "constructor"]);
  assert.deepEqual(out.mentions, ["__proto__"]);
  assert.deepEqual(out.urls, []);
});

test("result is deterministic and JSON-serializable", () => {
  const input = { text: "#A @B https://x.y/z" };
  const a = run(input);
  const b = run(input);
  assert.deepEqual(a, b);
  assert.equal(JSON.stringify(a), JSON.stringify(b));
  assert.deepEqual(JSON.parse(JSON.stringify(a)), a);
});
