// devtools/cron-describe
// Describe a standard 5-field cron expression (minute hour day-of-month month day-of-week)
// in plain English. Supports "*", "*/n" steps, "a-b" ranges (with optional "/n" step),
// "a,b,c" lists, and specific numeric values. Example:
//   "0 9 * * 1-5" -> "At 09:00, Monday through Friday"
// Pure and deterministic: no I/O, no clock, no randomness.

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const DAY_NAMES = [
  "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday",
];

const FIELD_SPECS = [
  { key: "minute", min: 0, max: 59 },
  { key: "hour", min: 0, max: 23 },
  { key: "dayOfMonth", min: 1, max: 31 },
  { key: "month", min: 1, max: 12 },
  { key: "dayOfWeek", min: 0, max: 7 }, // 0 and 7 are both Sunday
];

export const meta = {
  id: "devtools/cron-describe",
  name: "Cron Describe",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Translate a standard 5-field cron expression into a plain-English description, handling *, */n steps, a-b ranges, and a,b,c lists.",
  tags: ["cron", "scheduler", "devtools", "parser", "human-readable"],
  license: "MIT",
  inputs: {
    expr: "string — a 5-field cron expression: minute hour day-of-month month day-of-week",
  },
  outputs:
    "{ description: string, fields: { minute, hour, dayOfMonth, month, dayOfWeek } } — plain-English description plus the raw value of each cron field",
  source:
    "Original implementation following the POSIX/Vixie crontab(5) field syntax; phrasing conventions inspired by common cron-description tools (e.g. cronstrue), no code copied.",
};

function pad2(n) {
  return String(n).padStart(2, "0");
}

function parseIntStrict(str, what) {
  if (!/^\d+$/.test(str)) {
    throw new Error(`Invalid ${what}: "${str}" is not a non-negative integer`);
  }
  return Number(str);
}

function checkBounds(value, spec, fieldName) {
  if (value < spec.min || value > spec.max) {
    throw new Error(
      `Value ${value} out of range for ${fieldName} (allowed ${spec.min}-${spec.max})`
    );
  }
}

// Parse one comma-separated token of a field into a typed node.
function parseToken(token, spec, fieldName) {
  if (token === "*") {
    return { type: "any" };
  }
  let stepMatch = token.match(/^(.+)\/(\d+)$/);
  let base = token;
  let step = null;
  if (stepMatch) {
    base = stepMatch[1];
    step = parseIntStrict(stepMatch[2], `step in ${fieldName}`);
    if (step < 1) {
      throw new Error(`Step must be >= 1 in ${fieldName} field: "${token}"`);
    }
  }
  if (base === "*") {
    // A step larger than the field span matches only the minimum value
    // (Vixie semantics: min, min+step, ... <= max), so describe it as that value.
    if (step !== null && step > spec.max - spec.min) {
      return { type: "value", value: spec.min };
    }
    return { type: "step", step };
  }
  const rangeMatch = base.match(/^(\d+)-(\d+)$/);
  if (rangeMatch) {
    const from = parseIntStrict(rangeMatch[1], fieldName);
    const to = parseIntStrict(rangeMatch[2], fieldName);
    checkBounds(from, spec, fieldName);
    checkBounds(to, spec, fieldName);
    if (from > to) {
      throw new Error(
        `Invalid range "${base}" in ${fieldName} field: start is greater than end`
      );
    }
    // Degenerate ranges match a single value; describing them as ranges
    // ("every minute from 1 through 1") is misleading, so collapse them.
    if (from === to || (step !== null && step > to - from)) {
      return { type: "value", value: from };
    }
    return { type: "range", from, to, step };
  }
  if (/^\d+$/.test(base)) {
    if (step !== null) {
      throw new Error(
        `Invalid token "${token}" in ${fieldName} field: step requires "*" or a range`
      );
    }
    const value = parseIntStrict(base, fieldName);
    checkBounds(value, spec, fieldName);
    return { type: "value", value };
  }
  throw new Error(`Invalid token "${token}" in ${fieldName} field`);
}

function parseField(field, spec) {
  if (field.length === 0) {
    throw new Error(`Empty ${spec.key} field`);
  }
  const tokens = field.split(",").map((t) => parseToken(t, spec, spec.key));
  if (tokens.length > 1 && tokens.some((t) => t.type === "any")) {
    throw new Error(`"*" cannot appear inside a list in ${spec.key} field`);
  }
  return tokens;
}

// "a", "a and b", "a, b, and c"
function joinList(items) {
  if (items.length === 0) return "";
  if (items.length === 1) return items[0];
  if (items.length === 2) return `${items[0]} and ${items[1]}`;
  return `${items.slice(0, -1).join(", ")}, and ${items[items.length - 1]}`;
}

function isSingleValue(tokens) {
  return tokens.length === 1 && tokens[0].type === "value";
}

function allValues(tokens) {
  return tokens.every((t) => t.type === "value");
}

function plural(n, word) {
  return n === 1 ? word : `${word}s`;
}

function describeMinuteToken(t) {
  switch (t.type) {
    case "any":
      return "every minute";
    case "step":
      return t.step === 1 ? "every minute" : `every ${t.step} minutes`;
    case "range":
      if (t.step !== null && t.step !== 1) {
        return `every ${t.step} minutes from ${t.from} through ${t.to}`;
      }
      return `every minute from ${t.from} through ${t.to}`;
    case "value":
      return `at minute ${t.value}`;
  }
}

function describeHourToken(t) {
  switch (t.type) {
    case "any":
      return "";
    case "step":
      return t.step === 1 ? "every hour" : `every ${t.step} hours`;
    case "range":
      if (t.step !== null && t.step !== 1) {
        return `every ${t.step} hours from ${t.from} through ${t.to}`;
      }
      return `during hours ${t.from} through ${t.to}`;
    case "value":
      return `during hour ${t.value}`;
  }
}

// Time phrase: merge minute+hour into "at HH:MM" style when both are plain values.
function describeTime(minuteTokens, hourTokens) {
  if (isSingleValue(minuteTokens) && allValues(hourTokens)) {
    const m = minuteTokens[0].value;
    const times = hourTokens.map((h) => `${pad2(h.value)}:${pad2(m)}`);
    return `at ${joinList(times)}`;
  }
  const parts = [];
  if (allValues(minuteTokens) && minuteTokens.length > 1) {
    parts.push(`at minutes ${joinList(minuteTokens.map((t) => String(t.value)))}`);
  } else {
    parts.push(joinList(minuteTokens.map(describeMinuteToken)));
  }
  let hourPhrase;
  if (allValues(hourTokens) && hourTokens.length > 1) {
    hourPhrase = `during hours ${joinList(hourTokens.map((t) => String(t.value)))}`;
  } else {
    hourPhrase = joinList(hourTokens.map(describeHourToken).filter((s) => s !== ""));
  }
  if (hourPhrase) parts.push(hourPhrase);
  return parts.join(", ");
}

function describeDayOfMonth(tokens) {
  if (tokens.length === 1 && tokens[0].type === "any") return "";
  if (allValues(tokens)) {
    const nums = tokens.map((t) => String(t.value));
    return `on ${plural(nums.length, "day")} ${joinList(nums)} of the month`;
  }
  const parts = tokens.map((t) => {
    switch (t.type) {
      case "step":
        return t.step === 1 ? "every day" : `every ${t.step} days of the month`;
      case "range":
        if (t.step !== null && t.step !== 1) {
          return `every ${t.step} days from day ${t.from} through ${t.to} of the month`;
        }
        return `on days ${t.from} through ${t.to} of the month`;
      case "value":
        return `on day ${t.value} of the month`;
      default:
        return "";
    }
  });
  return joinList(parts.filter((s) => s !== ""));
}

function describeMonth(tokens) {
  if (tokens.length === 1 && tokens[0].type === "any") return "";
  const name = (n) => MONTH_NAMES[n - 1];
  if (allValues(tokens)) {
    return `in ${joinList(tokens.map((t) => name(t.value)))}`;
  }
  const parts = tokens.map((t) => {
    switch (t.type) {
      case "step":
        return t.step === 1 ? "every month" : `every ${t.step} months`;
      case "range":
        if (t.step !== null && t.step !== 1) {
          return `every ${t.step} months from ${name(t.from)} through ${name(t.to)}`;
        }
        return `${name(t.from)} through ${name(t.to)}`;
      case "value":
        return `in ${name(t.value)}`;
      default:
        return "";
    }
  });
  return joinList(parts.filter((s) => s !== ""));
}

function describeDayOfWeek(tokens) {
  if (tokens.length === 1 && tokens[0].type === "any") return "";
  const name = (n) => DAY_NAMES[n % 7]; // 7 wraps to Sunday
  if (allValues(tokens)) {
    // 0 and 7 both mean Sunday; drop duplicate names ("Sunday and Sunday").
    const names = [...new Set(tokens.map((t) => name(t.value)))];
    return `on ${joinList(names)}`;
  }
  const parts = tokens.map((t) => {
    switch (t.type) {
      case "step":
        return t.step === 1
          ? "every day of the week"
          : `every ${t.step} days of the week`;
      case "range":
        if (t.step !== null && t.step !== 1) {
          return `every ${t.step} days from ${name(t.from)} through ${name(t.to)}`;
        }
        return `${name(t.from)} through ${name(t.to)}`;
      case "value":
        return `on ${name(t.value)}`;
      default:
        return "";
    }
  });
  return joinList(parts.filter((s) => s !== ""));
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("Input must be an object like { expr: string }");
  }
  const { expr } = input;
  if (typeof expr !== "string") {
    throw new Error("expr must be a string");
  }
  const rawFields = expr.trim().split(/\s+/);
  if (rawFields.length !== 5 || rawFields[0] === "") {
    throw new Error(
      `Cron expression must have exactly 5 fields, got ${rawFields[0] === "" ? 0 : rawFields.length}`
    );
  }

  const [minuteRaw, hourRaw, domRaw, monthRaw, dowRaw] = rawFields;
  const minuteTokens = parseField(minuteRaw, FIELD_SPECS[0]);
  const hourTokens = parseField(hourRaw, FIELD_SPECS[1]);
  const domTokens = parseField(domRaw, FIELD_SPECS[2]);
  const monthTokens = parseField(monthRaw, FIELD_SPECS[3]);
  const dowTokens = parseField(dowRaw, FIELD_SPECS[4]);

  const parts = [
    describeTime(minuteTokens, hourTokens),
    describeDayOfMonth(domTokens),
    describeMonth(monthTokens),
    describeDayOfWeek(dowTokens),
  ].filter((s) => s !== "");

  let description = parts.join(", ");
  description = description.charAt(0).toUpperCase() + description.slice(1);

  return {
    description,
    fields: {
      minute: minuteRaw,
      hour: hourRaw,
      dayOfMonth: domRaw,
      month: monthRaw,
      dayOfWeek: dowRaw,
    },
  };
}
