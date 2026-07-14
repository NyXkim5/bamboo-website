#!/usr/bin/env node
// Scaffold a new skill: creates skills/<domain>/<name>/{skill.mjs,skill.test.mjs}
// from a template that is already green (node --test passes immediately), so you
// start from a working skill and edit inward.
//
//   node core/new-skill.mjs <domain>/<name> ["one-line description"]
//   node core/new-skill.mjs finance/atr "Average True Range"
//
import { existsSync, mkdirSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");

export function scaffold(idArg, description = "") {
  const m = /^([a-z0-9-]+)\/([a-z0-9-]+)$/.exec(String(idArg || "").trim());
  if (!m) throw new Error(`expected "<domain>/<name>" (lowercase, kebab), got: ${idArg}`);
  const [, domain, name] = m;
  const id = `${domain}/${name}`;
  const dir = join(ROOT, "skills", domain, name);
  if (existsSync(dir)) throw new Error(`skill already exists: ${id}`);

  const title = name.split("-").map((w) => w[0].toUpperCase() + w.slice(1)).join(" ");
  const desc = description || `TODO: describe what ${id} does.`;

  const skill = `// Skill: ${id}
// ${desc}
// Pure + deterministic — no network, no deps.

export const meta = {
  id: ${JSON.stringify(id)},
  name: ${JSON.stringify(title)},
  domain: ${JSON.stringify(domain)},
  version: "0.1.0",
  description: ${JSON.stringify(desc)},
  tags: [${JSON.stringify(domain)}],
  license: "MIT",
  inputs: { value: "TODO: describe inputs" },
  outputs: "TODO: describe the returned shape",
  source: "Original implementation.",
};

export function run(input = {}) {
  // TODO: validate inputs and throw on bad input.
  // TODO: implement. Keep it pure and deterministic (no Date.now/Math.random/fs/network).
  return { ok: true, echo: input };
}
`;

  const test = `import { test } from "node:test";
import assert from "node:assert/strict";
import { run, meta } from "./skill.mjs";

test("meta is well-formed", () => {
  assert.equal(meta.id, ${JSON.stringify(id)});
  assert.equal(meta.domain, ${JSON.stringify(domain)});
  assert.ok(Array.isArray(meta.tags));
});

test("run returns an object", () => {
  const r = run({});
  assert.equal(typeof r, "object");
  assert.notEqual(r, null);
});

// TODO: replace the stub with real happy-path, edge-case, and invalid-input tests.
test("happy path (stub)", () => {
  assert.deepEqual(run({ value: 1 }).echo, { value: 1 });
});
`;

  mkdirSync(dir, { recursive: true });
  writeFileSync(join(dir, "skill.mjs"), skill);
  writeFileSync(join(dir, "skill.test.mjs"), test);
  return { id, dir: join("skills", domain, name) };
}

if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const [idArg, ...rest] = process.argv.slice(2);
  if (!idArg) {
    console.error('usage: node core/new-skill.mjs <domain>/<name> ["description"]');
    process.exit(1);
  }
  const { id, dir } = scaffold(idArg, rest.join(" "));
  console.log(`Scaffolded ${id} at ${dir}/`);
  console.log(`Next: implement run(), write real tests, then:`);
  console.log(`  node --test ${dir}/skill.test.mjs`);
  console.log(`  node core/registry.mjs && node core/build-catalog.mjs`);
}
