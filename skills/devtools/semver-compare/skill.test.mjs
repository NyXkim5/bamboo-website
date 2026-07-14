import test from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta has required fields", () => {
  assert.equal(meta.id, "devtools/semver-compare");
  assert.equal(meta.domain, "devtools");
  assert.equal(meta.version, "0.1.0");
  assert.equal(meta.license, "MIT");
  assert.ok(Array.isArray(meta.tags) && meta.tags.length > 0);
  assert.equal(typeof meta.description, "string");
  assert.equal(typeof meta.inputs, "object");
  assert.equal(typeof meta.outputs, "string");
  assert.equal(typeof meta.source, "string");
});

test("equal versions return 0 with parsed parts", () => {
  const out = run({ a: "1.2.3", b: "1.2.3" });
  assert.equal(out.result, 0);
  assert.deepEqual(out.aParsed, { major: 1, minor: 2, patch: 3, prerelease: null, build: null });
  assert.deepEqual(out.bParsed, { major: 1, minor: 2, patch: 3, prerelease: null, build: null });
});

test("major/minor/patch ordering", () => {
  assert.equal(run({ a: "2.0.0", b: "1.9.9" }).result, 1);
  assert.equal(run({ a: "1.2.3", b: "1.3.0" }).result, -1);
  assert.equal(run({ a: "1.2.4", b: "1.2.3" }).result, 1);
  // numeric, not lexicographic: 10 > 9
  assert.equal(run({ a: "1.10.0", b: "1.9.0" }).result, 1);
});

test("prerelease sorts before release of same version", () => {
  assert.equal(run({ a: "1.0.0-alpha", b: "1.0.0" }).result, -1);
  assert.equal(run({ a: "1.0.0", b: "1.0.0-rc.1" }).result, 1);
  const out = run({ a: "1.0.0-alpha.1", b: "1.0.0-alpha.1" });
  assert.equal(out.result, 0);
  assert.deepEqual(out.aParsed.prerelease, ["alpha", 1]);
});

test("prerelease identifier precedence (semver 2.0.0 chain)", () => {
  // 1.0.0-alpha < 1.0.0-alpha.1 < 1.0.0-alpha.beta < 1.0.0-beta
  //  < 1.0.0-beta.2 < 1.0.0-beta.11 < 1.0.0-rc.1
  assert.equal(run({ a: "1.0.0-alpha", b: "1.0.0-alpha.1" }).result, -1);
  assert.equal(run({ a: "1.0.0-alpha.1", b: "1.0.0-alpha.beta" }).result, -1);
  assert.equal(run({ a: "1.0.0-alpha.beta", b: "1.0.0-beta" }).result, -1);
  assert.equal(run({ a: "1.0.0-beta.2", b: "1.0.0-beta.11" }).result, -1);
  assert.equal(run({ a: "1.0.0-rc.1", b: "1.0.0-beta.11" }).result, 1);
});

test("invalid inputs throw", () => {
  assert.throws(() => run({ a: "1.2", b: "1.2.3" }));
  assert.throws(() => run({ a: "1.2.3", b: "1.2.3.4" }));
  assert.throws(() => run({ a: "01.2.3", b: "1.2.3" })); // leading zero
  assert.throws(() => run({ a: "1.2.3-", b: "1.2.3" })); // empty prerelease
  assert.throws(() => run({ a: "1.2.3-a..b", b: "1.2.3" })); // empty identifier
  assert.throws(() => run({ a: "1.2.3-01", b: "1.2.3" })); // leading zero in numeric prerelease
  assert.throws(() => run({ a: 123, b: "1.2.3" })); // non-string
  assert.throws(() => run({ a: "abc", b: "1.2.3" }));
  assert.throws(() => run(null));
  assert.throws(() => run("1.2.3"));
});

test("build metadata is parsed and ignored for precedence", () => {
  // SemVer 2.0.0 rule 10: build metadata MUST be ignored when determining precedence.
  assert.equal(run({ a: "1.2.3+build.1", b: "1.2.3+other-2" }).result, 0);
  assert.equal(run({ a: "1.0.0-alpha+exp.sha-5114f85", b: "1.0.0-alpha" }).result, 0);
  const out = run({ a: "1.2.3+001.sha-abc", b: "1.2.3" }); // leading zeros allowed in build
  assert.deepEqual(out.aParsed.build, ["001", "sha-abc"]);
  assert.equal(out.bParsed.build, null);
  assert.throws(() => run({ a: "1.2.3+", b: "1.2.3" })); // empty build metadata
  assert.throws(() => run({ a: "1.2.3+a..b", b: "1.2.3" })); // empty build identifier
  assert.throws(() => run({ a: "1.2.3+a_b", b: "1.2.3" })); // illegal char in build identifier
});

test("components beyond MAX_SAFE_INTEGER throw instead of comparing imprecisely", () => {
  // These two differ, but both round to the same float via Number().
  assert.throws(() => run({ a: "1.0.9007199254740993", b: "1.0.9007199254740992" }));
  assert.throws(() => run({ a: "1.0.0-rc.9007199254740993", b: "1.0.0-rc.1" }));
  // MAX_SAFE_INTEGER itself is still accepted.
  assert.equal(run({ a: "1.0.9007199254740991", b: "1.0.9007199254740990" }).result, 1);
});

test("hyphen-only and mixed-case prerelease identifiers", () => {
  // "--" is a valid alphanumeric identifier; numeric identifiers sort below it.
  assert.equal(run({ a: "1.0.0-1", b: "1.0.0---" }).result, -1);
  // ASCII sort order: uppercase letters sort before lowercase.
  assert.equal(run({ a: "1.0.0-ALPHA", b: "1.0.0-alpha" }).result, -1);
});

test("negative and malformed cores throw", () => {
  assert.throws(() => run({ a: "-1.2.3", b: "1.2.3" }));
  assert.throws(() => run({ a: "1.-2.3", b: "1.2.3" }));
  assert.throws(() => run({ a: " 1.2.3", b: "1.2.3" }));
  assert.throws(() => run({ a: "v1.2.3", b: "1.2.3" }));
  assert.throws(() => run({ a: "1.2.3 ", b: "1.2.3" }));
});

test("comparison is antisymmetric", () => {
  const pairs = [
    ["1.0.0-alpha", "1.0.0"],
    ["1.2.3", "1.2.4"],
    ["2.0.0-rc.1", "2.0.0-rc.2"],
  ];
  for (const [a, b] of pairs) {
    assert.equal(run({ a, b }).result, -run({ a: b, b: a }).result);
  }
});
