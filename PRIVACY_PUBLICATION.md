# Privacy update — published September 16, 2026

Prepared September 16, 2026 against commit
`119e2a3a56d49c50f5b6d492db0f973eb31a3040` from
`https://github.com/NyXkim5/bamboo-website.git`.

The privacy, support, and homepage FAQ updates from PR #2 are merged and verified
on the live site. Commit `af47f16` subsequently set the effective date to
September 16, 2026. Keep `https://bamboonutrition.app/privacy` as the App Store URL.
The Vercel integration deploys repository changes; no separate migration or
domain change is needed.

## Changes

- Replaced the privacy route's contradictory no-sharing, anonymous-identity,
  local-only, and universal non-retention claims with the reviewed app's actual
  account, backup, AI, diagnostic, deletion, and consent disclosures.
- Named the Gemma photo model, disclosed provider retention separately, retained
  the existing privacy email, and identified the owner-confirmed ArchvAI rights
  holder. Did not add a new governing-law clause to this website policy.
- Kept daily-insight cycle disclosure exact; did not advertise the unrouted coach.
- Corrected matching homepage FAQ and support-page claims, including cycle
  sharing, result review before saving, and deletion/export instructions.
- Preserved navigation, layout, colors, and typography. No dependency changes.

## Verification

- `npm test`: 12 passed (8 existing waitlist tests, 4 disclosure tests including
  a regression check against draft effective-date wording).
- `npm run type-check`: passed.
- `npm run lint`: no errors; existing unused `tabButtons` warning in
  `scripts/capture-screens.mjs`.
- `npm run build`: passed; `/privacy` and `/support` statically generated.
- Local production-browser checks: both routes returned HTTP 200 at 390px and
  1440px widths, without horizontal overflow or JavaScript page errors.
- pnpm installed the frozen-lockfile dependencies but reported blocked optional
  build scripts. npm ran the verification scripts against those dependencies
  successfully; no dependency scripts were newly approved.

## Publication verification

Live `/privacy`, `/support`, and `/` returned HTTP 200, and the corrected policy,
support explanations, and expanded homepage FAQ answers were verified. The old
blanket no-sharing/local-only assertions checked in those sections are absent.
The effective-date change is covered by a rendered-page regression test.

For future changes, review the Vercel preview before merging and verify actual
live page text afterward. Local build success alone is not publication proof.

The website's waitlist and existing domain email delivery configuration were not
changed or verified by this app-policy update.
