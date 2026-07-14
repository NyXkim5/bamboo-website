// Skill: devtools/semver-bump
// Compute the next semantic version from a current version and a set of
// Conventional Commit types (or an explicit release level). Pure + deterministic.

export const meta = {
  id: "devtools/semver-bump",
  name: "SemVer Next-Version",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Determine the next semantic version from the current version plus commit types (feat/fix/breaking) or an explicit level. Handles pre-release resets.",
  tags: ["devtools", "semver", "release", "versioning", "ci"],
  inputs: { current: "semver string e.g. '1.4.2'", commits: "string[] of types e.g. ['feat','fix']", level: "'major'|'minor'|'patch' (overrides commits)" },
  outputs: "{ current, next, bump }",
  license: "MIT",
  source: "Original implementation per semver.org 2.0.0 + Conventional Commits mapping.",
};

function parse(v) {
  const m = /^v?(\d+)\.(\d+)\.(\d+)(?:-[0-9A-Za-z.-]+)?$/.exec(String(v).trim());
  if (!m) throw new Error(`invalid semver: ${v}`);
  return { major: +m[1], minor: +m[2], patch: +m[3] };
}

function levelFromCommits(commits) {
  let level = null;
  for (const c of commits) {
    const t = String(c).toLowerCase();
    if (t.includes("breaking") || t.endsWith("!")) return "major";
    if (t === "feat" || t === "feature") level = level === "major" ? level : "minor";
    else if (level === null) level = "patch";
  }
  return level;
}

export function run(input = {}) {
  const { current = "0.1.0", commits = [], level } = input;
  const v = parse(current);
  const bump = level ?? levelFromCommits(commits) ?? "patch";

  let { major, minor, patch } = v;
  if (bump === "major") { major++; minor = 0; patch = 0; }
  else if (bump === "minor") { minor++; patch = 0; }
  else { patch++; }

  return { current, next: `${major}.${minor}.${patch}`, bump };
}
