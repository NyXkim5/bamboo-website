// Skill: devtools/ci-pipeline-gen
// Emit a CI workflow YAML from a small project description. Supports GitHub
// Actions and GitLab CI. Pure + deterministic — no network, no deps.
//
// Reference: GitHub Actions "Building and testing Node.js" + actions/starter-workflows
// (MIT) for the canonical job shape. Original implementation, no code copied.

export const meta = {
  id: "devtools/ci-pipeline-gen",
  name: "CI Pipeline Generator",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Generate a CI workflow (GitHub Actions or GitLab CI) YAML from a project description: platform, language versions, install/test/lint commands.",
  tags: ["devtools", "ci", "github-actions", "gitlab", "yaml", "codegen"],
  inputs: {
    platform: "'github' | 'gitlab' (default github)",
    node: "string[] of versions, e.g. ['20','22'] (matrix); omit for the default",
    install: "install command (default 'npm ci')",
    test: "test command (default 'npm test')",
    lint: "optional lint command (adds a step)",
  },
  outputs: "{ filename, yaml }",
  license: "MIT",
  source: "GitHub Actions docs + actions/starter-workflows (MIT) as the canonical job shape; original implementation.",
};

function q(s) {
  // Quote a YAML scalar only when it contains YAML-significant characters or a
  // leading indicator. Plain commands with spaces (e.g. "npm test") stay bare.
  const risky = /[:#&*!|>'"%@`{}\[\],]/.test(s) || /^[\s-]/.test(s) || s.trim() === "";
  return risky ? `'${String(s).replace(/'/g, "''")}'` : s;
}

function github({ node, install, test, lint }) {
  const versions = node.map((v) => `'${v}.x'`).join(", ");
  const lines = [
    "name: CI",
    "on: [push, pull_request]",
    "",
    "jobs:",
    "  test:",
    "    runs-on: ubuntu-latest",
    "    strategy:",
    "      matrix:",
    `        node-version: [${versions}]`,
    "    steps:",
    "      - uses: actions/checkout@v4",
    "      - uses: actions/setup-node@v4",
    "        with:",
    "          node-version: ${{ matrix.node-version }}",
    `      - run: ${q(install)}`,
  ];
  if (lint) lines.push(`      - run: ${q(lint)}`);
  lines.push(`      - run: ${q(test)}`);
  return { filename: ".github/workflows/ci.yml", yaml: lines.join("\n") + "\n" };
}

function gitlab({ node, install, test, lint }) {
  // GitLab: one job per version via a parallel matrix.
  const lines = [
    "stages:",
    "  - test",
    "",
    "test:",
    "  stage: test",
    "  image: node:$NODE",
    "  parallel:",
    "    matrix:",
    `      - NODE: [${node.map((v) => `"${v}"`).join(", ")}]`,
    "  script:",
    `    - ${install}`,
  ];
  if (lint) lines.push(`    - ${lint}`);
  lines.push(`    - ${test}`);
  return { filename: ".gitlab-ci.yml", yaml: lines.join("\n") + "\n" };
}

export function run(input = {}) {
  const {
    platform = "github",
    node = ["20", "22"],
    install = "npm ci",
    test = "npm test",
    lint,
  } = input;

  if (platform !== "github" && platform !== "gitlab") {
    throw new Error(`unknown platform: ${platform} (expected 'github' or 'gitlab')`);
  }
  if (!Array.isArray(node) || node.length === 0 || !node.every((v) => /^\d+$/.test(String(v)))) {
    throw new Error("node must be a non-empty array of major-version numbers, e.g. ['20','22']");
  }
  for (const [k, v] of Object.entries({ install, test })) {
    if (typeof v !== "string" || v.trim() === "") throw new Error(`${k} must be a non-empty string`);
  }
  if (lint !== undefined && (typeof lint !== "string" || lint.trim() === "")) {
    throw new Error("lint, if provided, must be a non-empty string");
  }

  const cfg = { node: node.map(String), install, test, lint };
  return platform === "github" ? github(cfg) : gitlab(cfg);
}
