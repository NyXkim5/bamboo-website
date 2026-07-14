// Tests for devtools/cron-describe
import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, "devtools/cron-describe");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("happy path: weekday morning cron matches spec example", () => {
  const out = run({ expr: "0 9 * * 1-5" });
  assert.equal(out.description, "At 09:00, Monday through Friday");
  assert.deepEqual(out.fields, {
    minute: "0",
    hour: "9",
    dayOfMonth: "*",
    month: "*",
    dayOfWeek: "1-5",
  });
});

test("all wildcards means every minute", () => {
  assert.equal(run({ expr: "* * * * *" }).description, "Every minute");
});

test("step values: every n minutes / every n hours", () => {
  assert.equal(run({ expr: "*/15 * * * *" }).description, "Every 15 minutes");
  assert.equal(
    run({ expr: "0 */2 * * *" }).description,
    "At minute 0, every 2 hours"
  );
});

test("specific date: day of month and month names", () => {
  assert.equal(
    run({ expr: "30 14 1 1 *" }).description,
    "At 14:30, on day 1 of the month, in January"
  );
});

test("hour list merges into multiple clock times", () => {
  assert.equal(
    run({ expr: "0 9,17 * * *" }).description,
    "At 09:00 and 17:00"
  );
});

test("minute list, hour range, and weekday range combine", () => {
  assert.equal(
    run({ expr: "0,30 8-18 * * 1-5" }).description,
    "At minutes 0 and 30, during hours 8 through 18, Monday through Friday"
  );
});

test("day-of-week 7 wraps to Sunday, lists of days named", () => {
  assert.equal(run({ expr: "0 0 * * 7" }).description, "At 00:00, on Sunday");
  assert.equal(
    run({ expr: "0 12 * * 1,3,5" }).description,
    "At 12:00, on Monday, Wednesday, and Friday"
  );
});

test("month range and extra whitespace tolerated", () => {
  assert.equal(
    run({ expr: "  0   6  *  3-5  * " }).description,
    "At 06:00, March through May"
  );
});

test("throws when not exactly 5 fields", () => {
  assert.throws(() => run({ expr: "0 9 * *" }), /exactly 5 fields/);
  assert.throws(() => run({ expr: "0 9 * * * *" }), /exactly 5 fields/);
  assert.throws(() => run({ expr: "" }), /exactly 5 fields/);
});

test("throws on out-of-range and malformed values", () => {
  assert.throws(() => run({ expr: "60 * * * *" }), /out of range/);
  assert.throws(() => run({ expr: "* 24 * * *" }), /out of range/);
  assert.throws(() => run({ expr: "* * 0 * *" }), /out of range/);
  assert.throws(() => run({ expr: "* * * 13 *" }), /out of range/);
  assert.throws(() => run({ expr: "* * * * 8" }), /out of range/);
  assert.throws(() => run({ expr: "foo * * * *" }), /Invalid token/);
  assert.throws(() => run({ expr: "5-2 * * * *" }), /start is greater/);
});

test("throws on zero step, step on plain value, and '*' inside a list", () => {
  assert.throws(() => run({ expr: "*/0 * * * *" }), /Step must be >= 1/);
  assert.throws(() => run({ expr: "1-5/0 * * * *" }), /Step must be >= 1/);
  assert.throws(() => run({ expr: "5/2 * * * *" }), /step requires/);
  assert.throws(() => run({ expr: "*,5 * * * *" }), /cannot appear inside a list/);
  assert.throws(() => run({ expr: "1,,2 * * * *" }), /Invalid token/);
});

test("degenerate ranges collapse to the single matching value", () => {
  assert.equal(run({ expr: "5-5 * * * *" }).description, "At minute 5");
  assert.equal(
    run({ expr: "0 0 * * 5-5" }).description,
    "At 00:00, on Friday"
  );
});

test("steps larger than the span describe only the value that fires", () => {
  // */61 in minutes matches only minute 0 (Vixie: min, min+step, ... <= max)
  assert.equal(run({ expr: "*/61 * * * *" }).description, "At minute 0");
  // 0-5/10 matches only minute 0, so it merges with the hour into a clock time
  assert.equal(run({ expr: "0-5/10 9 * * *" }).description, "At 09:00");
});

test("day-of-week 0 and 7 in one list dedupes to a single Sunday", () => {
  assert.equal(run({ expr: "0 0 * * 0,7" }).description, "At 00:00, on Sunday");
});

test("null-prototype input object and whitespace-only expr", () => {
  const input = Object.create(null);
  input.expr = "0 9 * * *";
  assert.equal(run(input).description, "At 09:00");
  assert.throws(() => run({ expr: "   " }), /exactly 5 fields/);
});

test("throws on non-string or missing expr", () => {
  assert.throws(() => run({}), /expr must be a string/);
  assert.throws(() => run({ expr: 42 }), /expr must be a string/);
  assert.throws(() => run(null), /Input must be an object/);
  assert.throws(() => run("0 9 * * *"), /Input must be an object/);
});
