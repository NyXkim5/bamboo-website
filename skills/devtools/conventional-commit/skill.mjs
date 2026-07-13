// Skill: devtools/conventional-commit
// Validate a commit message against the Conventional Commits spec and parse it
// into structured parts. Pure + deterministic.

export const meta = {
  id: "devtools/conventional-commit",
  name: "Conventional Commit Validator",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Validate and parse a Conventional Commits message (type(scope): subject) — checks allowed types, breaking-change markers, and subject rules.",
  tags: ["devtools", "git", "commit", "conventional-commits", "ci", "lint"],
  inputs: { message: "commit message string", maxSubjectLength: "int (default 72)" },
  outputs: "{ valid, type, scope, breaking, subject, errors: string[] }",
  license: "MIT",
  source: "Original implementation of the Conventional Commits 1.0.0 grammar.",
};

const TYPES = ["feat", "fix", "docs", "style", "refactor", "perf", "test", "build", "ci", "chore", "revert"];

export function run(input = {}) {
  const { message = "", maxSubjectLength = 72 } = input;
  const header = message.split(/\r?\n/)[0] ?? "";
  const errors = [];

  const m = /^(\w+)(\(([^)]+)\))?(!)?:\s?(.+)$/.exec(header);
  if (!m) {
    errors.push("header must match 'type(scope): subject'");
    return { valid: false, type: null, scope: null, breaking: false, subject: null, errors };
  }
  const [, type, , scope, bang, subject] = m;

  if (!TYPES.includes(type)) errors.push(`type '${type}' is not one of: ${TYPES.join(", ")}`);
  if (!subject || subject.trim().length === 0) errors.push("subject must not be empty");
  if (subject && subject.length > maxSubjectLength) errors.push(`subject exceeds ${maxSubjectLength} chars`);
  if (subject && /\.$/.test(subject)) errors.push("subject should not end with a period");
  if (subject && /^[A-Z]/.test(subject) && !/^[A-Z]{2,}/.test(subject)) {
    errors.push("subject should start lower-case (mood-imperative)");
  }

  const breaking = bang === "!" || /^BREAKING CHANGE:/m.test(message);

  return {
    valid: errors.length === 0,
    type,
    scope: scope ?? null,
    breaking,
    subject: subject?.trim() ?? null,
    errors,
  };
}
