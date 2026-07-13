# Skill specification

Every skill is a directory `skills/<domain>/<name>/` exporting a `meta` object
and a `run` function from `skill.mjs`.

## `meta` (required fields)

| Field | Type | Notes |
| --- | --- | --- |
| `id` | string | `"<domain>/<name>"`, unique, matches the folder path |
| `name` | string | Human-readable title |
| `domain` | string | Top-level category (e.g. `finance`, `design`) |
| `version` | string | Semver |
| `description` | string | One sentence on what it does |
| `tags` | string[] | Searchable keywords |
| `license` | string | SPDX id, usually `MIT` |
| `inputs` | object | Field → description (informational) |
| `outputs` | string | Shape description |
| `source` | string | Attribution / provenance note |

## `run(input) => output`

- Prefer **pure and deterministic**. Skills that must touch the network declare
  it in `tags` (`"network"`) and keep I/O at the edges so a pure core stays testable.
- Validate inputs; throw `Error` with a clear message on bad input.
- Return a plain JSON-serializable object.

## Tests

- `skill.test.mjs` using `node:test` + `node:assert`.
- Must cover: happy path, at least one edge case, and input validation.
- `node --test` is the green gate; a skill without passing tests does not ship.

## Adding a skill (loop or human)

1. Create the folder + `skill.mjs` + `skill.test.mjs`.
2. `node --test` green.
3. `node core/registry.mjs && node core/build-catalog.mjs` to refresh the index + catalog.
4. Commit; check the item off in `BACKLOG.md`.
