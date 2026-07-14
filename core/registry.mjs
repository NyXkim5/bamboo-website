// Registry: discover every skill under skills/**, validate its manifest, and
// expose the collection. `buildRegistry()` also writes registry.json for the
// frontend catalog and for other projects to consume without importing code.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname, relative, sep } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");

// Zero-dependency manifest schema. Kept in code (not Ajv) to preserve the
// no-runtime-dependency guarantee; still enforces types, formats, and
// cross-field/cross-skill invariants.
const STRING_FIELDS = ["id", "name", "domain", "version", "description", "license"];

// Validate one skill's manifest against the schema + its on-disk location.
// Returns an array of human-readable problems (empty = valid).
export function validateMeta(meta, file) {
  const errs = [];
  const at = file ? relative(ROOT, file) : "<meta>";
  if (!meta || typeof meta !== "object") return [`${at}: meta must be an object`];

  for (const k of STRING_FIELDS) {
    if (typeof meta[k] !== "string" || meta[k].trim() === "") errs.push(`${at}: meta.${k} must be a non-empty string`);
  }
  if (!Array.isArray(meta.tags) || meta.tags.length === 0 || !meta.tags.every((t) => typeof t === "string")) {
    errs.push(`${at}: meta.tags must be a non-empty string[]`);
  }
  if (typeof meta.id === "string" && !/^[a-z0-9-]+\/[a-z0-9-]+$/.test(meta.id)) {
    errs.push(`${at}: meta.id "${meta.id}" must match "<domain>/<name>" (lowercase kebab)`);
  }
  if (typeof meta.version === "string" && !/^\d+\.\d+\.\d+/.test(meta.version)) {
    errs.push(`${at}: meta.version "${meta.version}" must be semver-like (x.y.z)`);
  }
  if (typeof meta.id === "string" && typeof meta.domain === "string" && meta.id.split("/")[0] !== meta.domain) {
    errs.push(`${at}: meta.domain "${meta.domain}" does not match id prefix "${meta.id.split("/")[0]}"`);
  }
  // id must match the folder path skills/<domain>/<name>/skill.mjs
  if (file && typeof meta.id === "string") {
    const rel = relative(SKILLS_DIR, dirname(file)).split(sep).join("/");
    if (rel !== meta.id) errs.push(`${at}: meta.id "${meta.id}" does not match folder path "${rel}"`);
  }
  return errs;
}

function findSkillFiles(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    if (statSync(full).isDirectory()) out.push(...findSkillFiles(full));
    else if (name === "skill.mjs") out.push(full);
  }
  return out;
}

export async function loadSkills() {
  const files = findSkillFiles(SKILLS_DIR);
  const skills = [];
  const seen = new Map();
  const problems = [];
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    if (!mod.meta || typeof mod.run !== "function") {
      problems.push(`${relative(ROOT, file)}: a skill must export { meta, run }`);
      continue;
    }
    problems.push(...validateMeta(mod.meta, file));
    if (seen.has(mod.meta.id)) problems.push(`duplicate skill id "${mod.meta.id}" (${relative(ROOT, file)} and ${relative(ROOT, seen.get(mod.meta.id))})`);
    else seen.set(mod.meta.id, file);
    skills.push({ meta: mod.meta, run: mod.run, file });
  }
  if (problems.length) throw new Error(`invalid skill manifest(s):\n  - ${problems.join("\n  - ")}`);
  skills.sort((a, b) => a.meta.id.localeCompare(b.meta.id));
  return skills;
}

export async function buildRegistry() {
  const skills = await loadSkills();
  const registry = {
    generatedFrom: "core/registry.mjs",
    count: skills.length,
    domains: [...new Set(skills.map((s) => s.meta.domain))].sort(),
    skills: skills.map((s) => s.meta),
  };
  writeFileSync(join(ROOT, "registry.json"), JSON.stringify(registry, null, 2) + "\n");
  return registry;
}

// Allow `node core/registry.mjs` to regenerate registry.json directly.
if (import.meta.url === pathToFileURL(process.argv[1] ?? "").href) {
  const reg = await buildRegistry();
  console.log(`registry.json written: ${reg.count} skills across ${reg.domains.length} domains (${reg.domains.join(", ")})`);
}
