// Skill: devtools/code-review
// Heuristic static review of a source snippet — flags common smells with line
// numbers and severity. Pure + deterministic; no network, no deps.

export const meta = {
  id: "devtools/code-review",
  name: "Heuristic Code Review",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Scan a JS/TS snippet for common issues (debug logging, loose equality, TODOs, hardcoded secrets, empty catches) and return ranked findings with line numbers.",
  tags: ["code-review", "lint", "static-analysis", "ci"],
  inputs: { code: "source string", lang: "'js' | 'ts' (informational)" },
  outputs: "{ findings: [{ line, rule, severity, message }], score }",
  license: "MIT",
  source: "Original rule set inspired by common ESLint/SonarQube heuristics.",
};

const RULES = [
  { rule: "no-console", severity: "low", re: /\bconsole\.(log|debug|info)\b/, message: "Debug logging left in code" },
  { rule: "loose-equality", severity: "medium", re: /[^=!<>]==[^=]|[^=!]!=[^=]/, message: "Use === / !== instead of == / !=" },
  { rule: "todo-marker", severity: "low", re: /\b(TODO|FIXME|XXX|HACK)\b/, message: "Unresolved TODO/FIXME marker" },
  { rule: "empty-catch", severity: "medium", re: /catch\s*\([^)]*\)\s*\{\s*\}/, message: "Empty catch swallows errors" },
  { rule: "hardcoded-secret", severity: "high", re: /(api[_-]?key|secret|password|token)\s*[:=]\s*['"][^'"]{8,}['"]/i, message: "Possible hardcoded secret" },
  { rule: "debugger", severity: "medium", re: /\bdebugger\b/, message: "`debugger` statement left in code" },
  { rule: "var-keyword", severity: "low", re: /(^|[^.\w])var\s+\w/, message: "Prefer let/const over var" },
  { rule: "eval", severity: "high", re: /\beval\s*\(/, message: "Avoid eval() — injection risk" },
];

const WEIGHT = { low: 1, medium: 4, high: 10 };

export function run(input = {}) {
  const { code = "" } = input;
  const lines = code.split(/\r?\n/);
  const findings = [];
  lines.forEach((text, i) => {
    // Skip pure-comment lines for the noisier rules to cut false positives.
    for (const r of RULES) {
      if (r.re.test(text)) {
        findings.push({ line: i + 1, rule: r.rule, severity: r.severity, message: r.message });
      }
    }
  });
  const order = { high: 0, medium: 1, low: 2 };
  findings.sort((a, b) => order[a.severity] - order[b.severity] || a.line - b.line);
  const penalty = findings.reduce((s, f) => s + WEIGHT[f.severity], 0);
  const score = Math.max(0, 100 - penalty); // 100 = clean
  return { findings, score, linesScanned: lines.length };
}
