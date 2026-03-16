# Project Rules

Follow these rules unless I explicitly approve a change.

## Stack
- Use the current `React + Vite + Convex` stack.
- Do not replace Vite, React, or Convex unless explicitly approved.
- When auth is added, prefer `Convex Auth + Better Auth`.
- Only add `Resend` after a real sender domain exists.

## Environment Rules
- Frontend `.env` files are for public client config only.
- Keep secrets in Convex env, not in Vite env files.
- Do not guess which Convex deployment the app is using; confirm it first.
- Keep repo name, app name, Convex project name, and deployment URLs recorded in one place.

## Product Contract
- The backend is the source of truth for workflow rules.
- Policies are dynamic by company, category, and amount.
- Quote requirements are policy-driven.
- Approval steps are dynamic and request-specific.
- Only one approval step should be `pending` at a time; future steps stay `waiting`.
- Finance is the payout phase after business approvals.
- Saved beneficiary accounts are private to the owning user.

## Request Rules
- Match policy on submission in the backend, not only in the UI.
- Snapshot the matched policy onto each submitted request.
- Policy edits should affect only new or resubmitted requests.
- Enforce quote rules, permission checks, recall rules, resubmission rules, and payout transitions in backend mutations.
- Audit/timeline records should be created from backend actions, not only frontend state.

## Build Order
- Build backend contract before expanding frontend behavior.
- Wire schema, queries, and mutations before treating frontend workflow as real.
- Move local-state workflow into Convex before adding more product surface area.
- Add auth only after the workflow contract is clear.

## Frontend Rules
- Keep demo-only tools clearly separate from production flow.
- Do not let the UI invent permanent workflow rules.
- Keep frontend field names aligned with backend field names.
- Use mock data only as temporary scaffolding; do not spread page-owned business logic across components.

## Convex Rules
- After changing Convex modules, run `npm run convex:sync` before trusting frontend type or runtime errors.
- Before debugging a missing API/function issue, confirm the generated Convex bindings are up to date.
- Keep generated Convex files aligned with the deployed or current dev backend.

## Delivery
- Do not widen scope silently.
- If a request conflicts with these rules, pause and ask before changing direction.
- Prefer a narrow, trustworthy implementation over a broad but unstable one.
