# Payrail Thread Handoff

Use this at the start of the next Payrail development thread.

## Current state

- The app is a React + Vite frontend prototype.
- Workflow, settings, and demo data currently live in local state.
- The UI already supports:
  - dynamic approval policies
  - dynamic quote requirements
  - finance payout by line item
  - settings management for companies, users, policies, request rules, and saved accounts
- Convex is not wired yet; only the schema scaffold exists.

## Non-negotiable rules for the next thread

1. Keep the backend as the source of truth for workflow rules.
2. Snapshot the matched policy onto each request at submission time.
3. Keep future approval steps as `waiting`, with only one `pending` step at a time.
4. Treat Finance as the payout phase after business approvals.
5. Keep saved accounts private to the owning user.
6. Run Convex sync after backend changes before trusting frontend type/runtime issues.

## Priority order

1. Wire Convex schema, queries, and mutations
2. Move submit/approve/reject/recall/resubmit/pay logic to backend
3. Add real request and settings persistence
4. Add saved-account autocomplete in the request form
5. Add auth only after the backend contract is clear

## Recommended backend/auth direction

- Convex for backend
- Convex Auth + Better Auth for auth
- Resend for verification/password-reset emails
- Vite frontend uses only public envs
- Convex env stores secrets

## Copy-paste prompt for the next thread

> Continue Payrail from the current Vite frontend prototype. Keep the settings-driven workflow model intact: policies are dynamic by company/category/amount, quote requirements are policy-driven, approval steps are dynamic, Finance is the payout phase, and requests must store policy snapshots. Move the workflow engine into Convex with queries and mutations as the source of truth. Keep saved beneficiary accounts private per user and support autocomplete in the request form. After backend changes, run Convex sync before trusting frontend issues.
