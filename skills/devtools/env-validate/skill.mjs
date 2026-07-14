// Skill: devtools/env-validate
// Validate a set of environment variables against a required-keys schema.
// Pure + deterministic; never prints values (only key names + statuses).

export const meta = {
  id: "devtools/env-validate",
  name: "Env Schema Validator",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Check a parsed env object against a schema of required/optional keys with type and pattern rules. Reports missing/invalid keys by name only — never echoes secret values.",
  tags: ["devtools", "env", "config", "validation", "ci"],
  inputs: { env: "object of KEY→value", schema: "{ KEY: { required, type, pattern } }" },
  outputs: "{ valid, missing: string[], invalid: [{ key, reason }], checked }",
  license: "MIT",
  source: "Original implementation; dotenv-schema style validation.",
};

function typeOk(value, type) {
  if (!type || type === "string") return true;
  if (type === "number") return /^-?\d+(\.\d+)?$/.test(value);
  if (type === "boolean") return /^(true|false|0|1)$/i.test(value);
  if (type === "url") return /^https?:\/\/[^\s]+$/i.test(value);
  return true;
}

export function run(input = {}) {
  const { env = {}, schema = {} } = input;
  const missing = [];
  const invalid = [];
  let checked = 0;

  for (const [key, rule] of Object.entries(schema)) {
    const spec = rule ?? {};
    const present = Object.prototype.hasOwnProperty.call(env, key) && env[key] !== "";
    if (!present) {
      if (spec.required !== false) missing.push(key);
      continue;
    }
    checked++;
    const value = String(env[key]);
    if (!typeOk(value, spec.type)) {
      invalid.push({ key, reason: `expected ${spec.type}` });
      continue;
    }
    if (spec.pattern) {
      const re = spec.pattern instanceof RegExp ? spec.pattern : new RegExp(spec.pattern);
      if (!re.test(value)) invalid.push({ key, reason: "failed pattern" });
    }
  }

  return { valid: missing.length === 0 && invalid.length === 0, missing, invalid, checked };
}
