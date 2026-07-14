export const meta = {
  id: "devtools/semver-compare",
  name: "Semver Compare",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Compare two semantic version strings x.y.z[-prerelease][+build] and return -1, 0, or 1. Precedence follows major, minor, patch, then prerelease identifiers (a version with a prerelease sorts before the same version without one). Build metadata is validated but ignored for precedence, per SemVer 2.0.0.",
  tags: ["semver", "version", "compare", "sort", "devtools"],
  license: "MIT",
  inputs: {
    a: "string — first semver, e.g. \"1.2.3\" or \"1.2.3-alpha.1\"",
    b: "string — second semver to compare against a",
  },
  outputs:
    "object { result: -1|0|1, aParsed: {major,minor,patch,prerelease,build}, bParsed: {major,minor,patch,prerelease,build} }",
  source:
    "Original implementation following the SemVer 2.0.0 precedence rules (semver.org).",
};

const NUMERIC_RE = /^(0|[1-9]\d*)$/;
const IDENT_RE = /^[0-9A-Za-z-]+$/;

function parseSemver(value, label) {
  if (typeof value !== "string") {
    throw new Error(`Input "${label}" must be a string, got ${typeof value}`);
  }
  // Build metadata (everything after the first "+") is validated but ignored
  // for precedence, per SemVer 2.0.0 rule 10.
  const plusIdx = value.indexOf("+");
  const withoutBuild = plusIdx === -1 ? value : value.slice(0, plusIdx);
  const buildRaw = plusIdx === -1 ? null : value.slice(plusIdx + 1);

  const dashIdx = withoutBuild.indexOf("-");
  const core = dashIdx === -1 ? withoutBuild : withoutBuild.slice(0, dashIdx);
  const preRaw = dashIdx === -1 ? null : withoutBuild.slice(dashIdx + 1);

  const coreParts = core.split(".");
  if (coreParts.length !== 3) {
    throw new Error(`Invalid semver "${value}" for "${label}": core must be major.minor.patch`);
  }
  const nums = coreParts.map((part) => {
    if (!NUMERIC_RE.test(part)) {
      throw new Error(
        `Invalid semver "${value}" for "${label}": "${part}" is not a valid numeric identifier`
      );
    }
    const n = Number(part);
    if (n > Number.MAX_SAFE_INTEGER) {
      throw new Error(
        `Invalid semver "${value}" for "${label}": "${part}" exceeds MAX_SAFE_INTEGER`
      );
    }
    return n;
  });

  let prerelease = null;
  if (preRaw !== null) {
    if (preRaw.length === 0) {
      throw new Error(`Invalid semver "${value}" for "${label}": empty prerelease`);
    }
    prerelease = preRaw.split(".").map((id) => {
      if (id.length === 0 || !IDENT_RE.test(id)) {
        throw new Error(
          `Invalid semver "${value}" for "${label}": bad prerelease identifier "${id}"`
        );
      }
      if (/^\d+$/.test(id)) {
        if (!NUMERIC_RE.test(id)) {
          throw new Error(
            `Invalid semver "${value}" for "${label}": numeric prerelease identifier "${id}" has leading zero`
          );
        }
        const n = Number(id);
        if (n > Number.MAX_SAFE_INTEGER) {
          throw new Error(
            `Invalid semver "${value}" for "${label}": numeric prerelease identifier "${id}" exceeds MAX_SAFE_INTEGER`
          );
        }
        return n;
      }
      return id;
    });
  }

  let build = null;
  if (buildRaw !== null) {
    if (buildRaw.length === 0) {
      throw new Error(`Invalid semver "${value}" for "${label}": empty build metadata`);
    }
    build = buildRaw.split(".").map((id) => {
      // Build identifiers allow leading zeros, but must be non-empty [0-9A-Za-z-]+.
      if (id.length === 0 || !IDENT_RE.test(id)) {
        throw new Error(
          `Invalid semver "${value}" for "${label}": bad build identifier "${id}"`
        );
      }
      return id;
    });
  }

  return { major: nums[0], minor: nums[1], patch: nums[2], prerelease, build };
}

function cmp(x, y) {
  return x < y ? -1 : x > y ? 1 : 0;
}

function comparePrerelease(a, b) {
  if (a === null && b === null) return 0;
  if (a === null) return 1; // no prerelease > with prerelease
  if (b === null) return -1;
  const len = Math.min(a.length, b.length);
  for (let i = 0; i < len; i++) {
    const ai = a[i];
    const bi = b[i];
    if (ai === bi) continue;
    const aNum = typeof ai === "number";
    const bNum = typeof bi === "number";
    if (aNum && bNum) return cmp(ai, bi);
    if (aNum) return -1; // numeric < alphanumeric
    if (bNum) return 1;
    return ai < bi ? -1 : 1; // ASCII lexical
  }
  return cmp(a.length, b.length); // fewer identifiers < more
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object { a, b }");
  }
  const aParsed = parseSemver(input.a, "a");
  const bParsed = parseSemver(input.b, "b");

  let result =
    cmp(aParsed.major, bParsed.major) ||
    cmp(aParsed.minor, bParsed.minor) ||
    cmp(aParsed.patch, bParsed.patch) ||
    comparePrerelease(aParsed.prerelease, bParsed.prerelease);

  return { result, aParsed, bParsed };
}
