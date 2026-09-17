# Privacy update — pending publication

Prepared September 16, 2026 against commit
`119e2a3a56d49c50f5b6d492db0f973eb31a3040` from
`https://github.com/NyXkim5/bamboo-website.git`.

This change is prepared for teammate review and deployment through a pull
request. No production deployment or merge is performed by this handoff.
Keep `https://bamboonutrition.app/privacy` as the App Store URL. GitHub reports
an active Vercel integration; a branch push may create a preview deployment.

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

- `npm test`: 11 passed (8 existing waitlist tests, 3 new disclosure tests).
- `npm run type-check`: passed.
- `npm run lint`: no errors; existing unused `tabButtons` warning in
  `scripts/capture-screens.mjs`.
- `npm run build`: passed; `/privacy` and `/support` statically generated.
- Local production-browser checks: both routes returned HTTP 200 at 390px and
  1440px widths, without horizontal overflow or JavaScript page errors.
- pnpm installed the frozen-lockfile dependencies but reported blocked optional
  build scripts. npm ran the verification scripts against those dependencies
  successfully; no dependency scripts were newly approved.

## Before publishing

1. Confirm the Vercel project/domain is connected to this repository and the
   intended production branch. A push may auto-deploy; do not assume it is a
   draft-only action.
2. Replace the prepared-revision date on the privacy page with the actual
   effective publication date.
3. Preview the change and deploy to the existing project once access is ready.
4. Verify live `/privacy` and `/support` return HTTP 200 and serve the corrected
   text; verify homepage FAQ too. Local build success is not publication proof.
5. Record the deployment ID, commit, and publication date in the app's submission
   handoff. Check that App Store privacy labels remain aligned.

The website's waitlist and existing domain email delivery configuration were not
changed or verified by this app-policy update.
