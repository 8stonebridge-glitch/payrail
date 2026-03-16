# Build Checklist

Build this app in this order. Do not skip ahead.

## Phase 1 - Freeze foundations
- Confirm the stack is:
  - `React + Vite`
  - `Convex`
  - later `Convex Auth + Better Auth`
- Confirm the user-facing product name.
- Confirm the Convex project name and deployment URL.
- Confirm which values belong in Vite env and which belong in Convex env.

## Phase 2 - Confirm the current prototype contract
- Review the current frontend workflow model.
- Confirm:
  - dynamic approval policies by company/category/amount
  - dynamic quote requirements
  - finance payout by line item
  - settings management for companies, users, policies, request rules, and saved accounts
- Keep this contract intact while moving logic into Convex.

## Phase 3 - Lock the backend schema
- Verify or refine schema for:
  - companies
  - users
  - policies
  - request rules
  - requests
  - approval steps
  - payouts
  - saved beneficiary accounts
  - audit/timeline records
- Ensure requests can store policy snapshots.
- Ensure approval steps can represent `waiting`, `pending`, and completed states cleanly.

## Phase 4 - Build the workflow engine in Convex
- Implement backend policy matching.
- Implement backend quote-rule enforcement.
- Implement request submission in Convex.
- Generate approval steps in Convex.
- Keep only one current approval step `pending`.
- Move reject, recall, resubmit, and payout transitions to Convex mutations.

## Phase 5 - Persist settings in Convex
- Move settings UI from local state to real Convex persistence.
- Persist:
  - companies
  - users
  - policies
  - request rules
- Confirm the frontend still behaves the same after persistence is added.

## Phase 6 - Persist requests end to end
- Replace local request state with Convex queries and mutations.
- Store policy snapshot data at submit time.
- Persist approval step records per request.
- Persist timeline/audit events for all workflow actions.

## Phase 7 - Saved accounts
- Add Convex persistence for saved beneficiary accounts.
- Keep them private per user.
- Add request-form autocomplete backed by the current user's saved accounts.

## Phase 8 - Frontend integration cleanup
- Replace local workflow logic with data from Convex.
- Remove frontend-only workflow decisions once backend truth exists.
- Keep demo role-switching clearly separated from production flow.
- Keep field names aligned with backend schema.

## Phase 9 - Auth
- Only after the workflow contract is stable:
  - add `Convex Auth + Better Auth`
  - add custom auth screens
  - wire real user identity into permissions and saved accounts

## Phase 10 - Email
- Only after auth and sender setup are ready:
  - add `Resend`
  - wire verification/reset flows

## Phase 11 - Sync and quality gates
- After backend changes, run:

```bash
npm run convex:sync
```

- Before handoff or deployment, run:

```bash
npm run check
```

- Before debugging a missing API/function issue, confirm:
  - Convex dev/deploy ran against the intended project
  - generated bindings are current
  - frontend is pointed at the correct backend

## Phase 12 - Only after the core loop is stable
- improve dashboards
- improve notifications
- improve finance reporting
- improve admin tools
- improve email flows

Do not add these early if the workflow engine is still local-state driven.
