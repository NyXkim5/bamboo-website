// Registry: discover every skill under skills/**, validate its manifest, and
// expose the collection. `buildRegistry()` also writes registry.json for the
// frontend catalog and for other projects to consume without importing code.

import { readdirSync, statSync, writeFileSync } from "node:fs";
import { join, dirname } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const SKILLS_DIR = join(ROOT, "skills");

const REQUIRED_META = ["id", "name", "domain", "version", "description", "tags", "license"];

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
  for (const file of files) {
    const mod = await import(pathToFileURL(file).href);
    if (!mod.meta || typeof mod.run !== "function") {
      throw new Error(`${file}: a skill must export { meta, run }`);
    }
    for (const key of REQUIRED_META) {
      if (mod.meta[key] === undefined) throw new Error(`${file}: meta.${key} is required`);
    }
    skills.push({ meta: mod.meta, run: mod.run, file });
  }
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
