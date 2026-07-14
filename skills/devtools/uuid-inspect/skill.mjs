export const meta = {
  id: "devtools/uuid-inspect",
  name: "UUID Inspect",
  domain: "devtools",
  version: "0.1.0",
  description:
    "Validate a UUID string (8-4-4-4-12 hex layout) and report its version digit, variant family, and whether it is the nil UUID.",
  tags: ["uuid", "guid", "validation", "rfc4122", "devtools"],
  license: "MIT",
  inputs: {
    uuid: {
      type: "string",
      required: true,
      description: "Candidate UUID string, e.g. 123e4567-e89b-42d3-a456-426614174000 (case-insensitive).",
    },
  },
  outputs:
    "{ valid: boolean, version: number|null, variant: 'NCS'|'RFC4122'|'Microsoft'|'Future'|null, isNil: boolean }",
  source:
    "UUID layout, version field, and variant bit rules per RFC 4122 / RFC 9562 (ISO/IEC 9834-8). Original implementation; no code copied.",
};

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

function variantFromNibble(n) {
  // Variant is encoded in the top bits of the 17th hex digit (clock_seq_hi_and_reserved).
  if (n <= 0x7) return "NCS"; // 0xx : NCS backward compatibility
  if (n <= 0xb) return "RFC4122"; // 10x : RFC 4122 / RFC 9562
  if (n <= 0xd) return "Microsoft"; // 110 : Microsoft COM/DCOM
  return "Future"; // 111 : reserved for future definition
}

export function run(input) {
  if (input === null || typeof input !== "object" || Array.isArray(input)) {
    throw new Error("input must be an object like { uuid: string }");
  }
  const { uuid } = input;
  if (typeof uuid !== "string") {
    throw new Error("input.uuid must be a string");
  }

  if (!UUID_RE.test(uuid)) {
    return { valid: false, version: null, variant: null, isNil: false };
  }

  const hex = uuid.toLowerCase().replace(/-/g, "");
  const isNil = hex === "00000000000000000000000000000000";

  // 13th hex digit (index 12) is the version field.
  const version = parseInt(hex[12], 16);
  // 17th hex digit (index 16) carries the variant bits.
  const variant = variantFromNibble(parseInt(hex[16], 16));

  return { valid: true, version, variant, isNil };
}
