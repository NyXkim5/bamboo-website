export const meta = {
  id: "devtools/duration",
  name: "Duration Parser & Formatter",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Parse duration strings like '1h30m', '90m', '2d4h', '45s' into total seconds, and format a number of seconds into a compact human-readable string like '1h 30m'.",
  tags: ["duration", "time", "parse", "format", "devtools"],
  license: "MIT",
  inputs: {
    parse: "string (optional) — duration string composed of number+unit tokens using units d, h, m, s (e.g. '1h30m' or '1h 30m'; whitespace between tokens is allowed). Mutually exclusive with 'format'.",
    format: "number (optional) — non-negative number of seconds to format. Mutually exclusive with 'parse'."
  },
  outputs:
    "{ seconds: number } when parsing, or { text: string } when formatting.",
  source:
    "Standard unit-token duration parsing/formatting as popularized by Go's time.ParseDuration and the npm 'ms' convention; implemented independently from the unit-conversion definitions (1d=86400s, 1h=3600s, 1m=60s)."
};

const UNIT_SECONDS = { d: 86400, h: 3600, m: 60, s: 1 };

function parseDuration(str) {
  if (typeof str !== "string") {
    throw new Error("'parse' must be a string");
  }
  const s = str.trim();
  if (s.length === 0) {
    throw new Error("Cannot parse empty duration string");
  }
  const tokenRe = /(\d+(?:\.\d+)?)([dhms])/y;
  let seconds = 0;
  let index = 0;
  let matched = false;
  while (index < s.length) {
    // Allow whitespace between tokens so format() output ("1h 30m") round-trips.
    if (/\s/.test(s[index])) {
      index += 1;
      continue;
    }
    tokenRe.lastIndex = index;
    const m = tokenRe.exec(s);
    if (!m) {
      throw new Error(`Unparseable duration: ${JSON.stringify(str)}`);
    }
    seconds += Number(m[1]) * UNIT_SECONDS[m[2]];
    index = tokenRe.lastIndex;
    matched = true;
  }
  if (!matched || !Number.isFinite(seconds)) {
    throw new Error(`Unparseable duration: ${JSON.stringify(str)}`);
  }
  return seconds;
}

function formatDuration(totalSeconds) {
  if (typeof totalSeconds !== "number" || !Number.isFinite(totalSeconds)) {
    throw new Error("'format' must be a finite number");
  }
  if (totalSeconds < 0) {
    throw new Error("Cannot format a negative duration");
  }
  let rem = Math.round(totalSeconds);
  if (rem === 0) return "0s";
  const parts = [];
  for (const unit of ["d", "h", "m", "s"]) {
    const size = UNIT_SECONDS[unit];
    const count = Math.floor(rem / size);
    if (count > 0) {
      parts.push(`${count}${unit}`);
      rem -= count * size;
    }
  }
  return parts.join(" ");
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object with 'parse' or 'format'");
  }
  const hasParse = Object.prototype.hasOwnProperty.call(input, "parse");
  const hasFormat = Object.prototype.hasOwnProperty.call(input, "format");
  if (hasParse === hasFormat) {
    throw new Error("Provide exactly one of 'parse' (string) or 'format' (number)");
  }
  if (hasParse) {
    return { seconds: parseDuration(input.parse) };
  }
  return { text: formatDuration(input.format) };
}
