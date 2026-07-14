// devtools/gitignore-gen — Generate a combined .gitignore from stack names.
// Combines built-in ignore templates (node, python, macos, jetbrains, vscode, rust)
// into a single sectioned .gitignore string; unrecognized stacks are reported back.

const TEMPLATES = {
  node: [
    "node_modules/",
    "npm-debug.log*",
    "yarn-debug.log*",
    "yarn-error.log*",
    ".pnpm-debug.log*",
    "dist/",
    ".env",
    ".env.local",
    "coverage/",
    ".npm/",
  ],
  python: [
    "__pycache__/",
    "*.py[cod]",
    "*.egg-info/",
    ".eggs/",
    "build/",
    "dist/",
    ".venv/",
    "venv/",
    ".pytest_cache/",
    ".mypy_cache/",
    ".coverage",
  ],
  macos: [
    ".DS_Store",
    ".AppleDouble",
    ".LSOverride",
    "Icon\r",
    "._*",
    ".Spotlight-V100",
    ".Trashes",
  ],
  jetbrains: [
    ".idea/",
    "*.iml",
    "*.iws",
    "out/",
    ".idea_modules/",
  ],
  vscode: [
    ".vscode/*",
    "!.vscode/settings.json",
    "!.vscode/tasks.json",
    "!.vscode/launch.json",
    "!.vscode/extensions.json",
    "*.code-workspace",
  ],
  rust: [
    "target/",
    "debug/",
    "**/*.rs.bk",
    "*.pdb",
    "Cargo.lock",
  ],
};

export const meta = {
  id: "devtools/gitignore-gen",
  name: "Gitignore Generator",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Generate a combined .gitignore from an array of stack names using a small built-in template map (node, python, macos, jetbrains, vscode, rust).",
  tags: ["gitignore", "git", "devtools", "scaffolding", "generator"],
  license: "MIT",
  inputs: {
    stacks:
      "string[] — stack names to include (case-insensitive), e.g. ['node', 'macos']",
  },
  outputs:
    "{ content: string (sectioned .gitignore text), unknown: string[] (unrecognized stack names) }",
  source:
    "Ignore patterns modeled on the community conventions popularized by github/gitignore (CC0) and gitignore.io; templates written from scratch, no copied code.",
};

export function run(input) {
  if (input == null || typeof input !== "object") {
    throw new Error("input must be an object with a 'stacks' array");
  }
  const { stacks } = input;
  if (!Array.isArray(stacks)) {
    throw new Error("stacks must be an array of strings");
  }

  const sections = [];
  const unknown = [];
  const seen = new Set();

  for (const raw of stacks) {
    if (typeof raw !== "string") {
      throw new Error("stacks must contain only strings");
    }
    const key = raw.trim().toLowerCase();
    if (seen.has(key)) continue; // skip duplicates
    seen.add(key);

    // Object.hasOwn guards against prototype-chain keys ("constructor",
    // "toString", "__proto__", ...) resolving to non-array values and crashing.
    const patterns = Object.hasOwn(TEMPLATES, key) ? TEMPLATES[key] : undefined;
    if (!patterns) {
      unknown.push(raw);
      continue;
    }
    sections.push(`# ${key}\n${patterns.join("\n")}`);
  }

  const content = sections.length ? sections.join("\n\n") + "\n" : "";
  return { content, unknown };
}
