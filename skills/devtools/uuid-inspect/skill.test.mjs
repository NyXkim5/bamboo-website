import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta shape", () => {
  assert.equal(meta.id, "devtools/uuid-inspect");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("valid v4 RFC4122 UUID", () => {
  // hex without dashes: 123e4567e89b42d3a456426614174000
  // 13th digit (index 12) = '4' -> version 4
  // 17th digit (index 16) = 'a' (0b1010) -> RFC4122 variant
  const out = run({ uuid: "123e4567-e89b-42d3-a456-426614174000" });
  assert.deepEqual(out, {
    valid: true,
    version: 4,
    variant: "RFC4122",
    isNil: false,
  });
});

test("valid v1 UUID, uppercase accepted", () => {
  // 13th digit = '1' -> version 1; 17th digit = 'b' (0b1011) -> RFC4122
  const out = run({ uuid: "C232AB00-9414-11EC-B3C8-9F6BDECED846" });
  assert.deepEqual(out, {
    valid: true,
    version: 1,
    variant: "RFC4122",
    isNil: false,
  });
});

test("nil UUID", () => {
  const out = run({ uuid: "00000000-0000-0000-0000-000000000000" });
  // version digit 0, variant nibble 0 (0b0000) -> NCS family
  assert.deepEqual(out, {
    valid: true,
    version: 0,
    variant: "NCS",
    isNil: true,
  });
});

test("variant families: Microsoft, Future, NCS", () => {
  // 17th nibble 'c' (0b1100) -> Microsoft
  assert.equal(
    run({ uuid: "123e4567-e89b-42d3-c456-426614174000" }).variant,
    "Microsoft"
  );
  // 17th nibble 'e' (0b1110) -> Future
  assert.equal(
    run({ uuid: "123e4567-e89b-42d3-e456-426614174000" }).variant,
    "Future"
  );
  // 17th nibble '7' (0b0111) -> NCS
  assert.equal(
    run({ uuid: "123e4567-e89b-42d3-7456-426614174000" }).variant,
    "NCS"
  );
});

test("malformed strings return valid:false, no throw", () => {
  const bad = [
    "",
    "not-a-uuid",
    "123e4567e89b42d3a456426614174000", // missing dashes
    "123e4567-e89b-42d3-a456-42661417400", // too short
    "123e4567-e89b-42d3-a456-4266141740000", // too long
    "g23e4567-e89b-42d3-a456-426614174000", // non-hex char
    "123e4567-e89b-42d3-a456_426614174000", // wrong separator
    " 123e4567-e89b-42d3-a456-426614174000", // leading space
  ];
  for (const uuid of bad) {
    assert.deepEqual(
      run({ uuid }),
      { valid: false, version: null, variant: null, isNil: false },
      `expected invalid for: ${JSON.stringify(uuid)}`
    );
  }
});

test("max UUID (RFC 9562) is valid, version 15, Future variant, not nil", () => {
  const out = run({ uuid: "ffffffff-ffff-ffff-ffff-ffffffffffff" });
  assert.deepEqual(out, {
    valid: true,
    version: 15,
    variant: "Future",
    isNil: false,
  });
});

test("anchoring and format edges rejected: trailing newline, urn prefix, braces, non-ASCII hex lookalike", () => {
  const bad = [
    "123e4567-e89b-42d3-a456-426614174000\n", // $ must not match before trailing newline
    "urn:uuid:123e4567-e89b-42d3-a456-426614174000",
    "{123e4567-e89b-42d3-a456-426614174000}",
    "123e4567-e89b-42d3-ａ456-426614174000", // fullwidth 'a' must not case-fold into [a-f]
  ];
  for (const uuid of bad) {
    assert.deepEqual(
      run({ uuid }),
      { valid: false, version: null, variant: null, isNil: false },
      `expected invalid for: ${JSON.stringify(uuid)}`
    );
  }
});

test("variant nibble family boundaries: 8/9 RFC4122, d Microsoft, f Future", () => {
  const at = (n) => run({ uuid: `123e4567-e89b-42d3-${n}456-426614174000` }).variant;
  assert.equal(at("8"), "RFC4122"); // 0b1000 lower bound of 10xx
  assert.equal(at("9"), "RFC4122"); // 0b1001
  assert.equal(at("d"), "Microsoft"); // 0b1101 upper bound of 110x
  assert.equal(at("f"), "Future"); // 0b1111
});

test("boxed String and other non-primitive uuid values throw", () => {
  assert.throws(
    () => run({ uuid: new String("123e4567-e89b-42d3-a456-426614174000") }),
    Error
  );
  assert.throws(() => run({ uuid: ["123e4567-e89b-42d3-a456-426614174000"] }), Error);
  assert.throws(() => run(["123e4567-e89b-42d3-a456-426614174000"]), Error);
});

test("bad input types throw", () => {
  assert.throws(() => run(null), Error);
  assert.throws(() => run("123e4567-e89b-42d3-a456-426614174000"), Error);
  assert.throws(() => run({}), Error);
  assert.throws(() => run({ uuid: 42 }), Error);
  assert.throws(() => run({ uuid: null }), Error);
});
