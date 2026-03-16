# Payrail Setup Foundation

This file applies the lessons from the previous app setup thread to Payrail before backend development begins.

## Why this exists

The biggest risk is not feature work. It is configuration drift between:

1. the local frontend
2. the Convex backend
3. generated Convex bindings
4. auth and email setup
5. deployment environment variables

If those drift apart, the app can look broken even when most of the code is fine.

## Identity map

Fill these in before wiring the real backend:

- Repo/workspace: `PAYRAIL`
- Package name: `payrail`
- User-facing product name: `Rork Payment Hub`
- Convex project name: `TBD`
- Dev deployment URL: `TBD`
- Production deployment URL: `TBD`
- Web app URL: `TBD`

## Recommended setup order for this app

### Phase 1. Foundations

1. Confirm the app name, repo name, and Convex project name on day one.
2. Keep a frontend `.env` for public config only.
3. Keep backend secrets in Convex env, not in Vite env.
4. Decide early whether the app will stay web-first or also get an Expo client later.

### Phase 2. Backend shape

1. Treat the backend as the source of truth for workflow rules.
2. Snapshot the matched policy onto each submitted request.
3. Store dynamic approval steps as request-specific step records.
4. Enforce quote rules in backend mutations, not only in the form.
5. Keep saved accounts private per user.

### Phase 3. Auth and email

For the real app, prefer:

1. Convex Auth + Better Auth
2. Custom auth screens
3. Resend only after a real sender domain exists
4. A normal web confirmation page first if a mobile client is added later

### Phase 4. Feature wiring

Only after backend/auth foundations are stable should we wire:

1. request submission
2. approvals and rejection
3. finance payout
4. saved account autocomplete
5. notifications and dashboards

## Rules we are adopting in Payrail

### Naming and environment clarity

- Never guess which backend the app is pointed at.
- Record repo name, app name, Convex project name, and deployment URLs in one place.
- Do not treat a local `.env` file as the source of truth for backend secrets.

### Backend alignment

Before debugging a runtime issue, check:

1. Is the frontend on the same code state as the intended backend?
2. Did Convex get redeployed from that code?
3. Did codegen/sync run after backend changes?
4. Does the function the frontend expects actually exist in the generated API?

Command to remember:

```bash
npm run convex:sync
```

### Workflow enforcement

The backend must own:

- policy matching by company + category + amount
- approval-step generation
- role/company permission checks
- quote validation and exceptions
- recall and resubmission rules
- per-line-item payout transitions
- audit timeline creation

Frontend validation is helpful, but it is not the contract.

### Policy versioning

Policy edits must only affect new or resubmitted requests.
Requests already in flight should keep the policy snapshot they were created with.

### Saved accounts

Saved beneficiary accounts are:

- private to the owning user
- available as request-form suggestions for that user only
- deletable by the owner
- encrypted at rest in the real backend

## Frontend env template

Use `.env.example` as the local template:

```env
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL=
VITE_APP_ENV=development
```

## Backend env checklist

When backend/auth work starts, these are the important Convex envs:

```bash
npx convex env set BETTER_AUTH_SECRET <random-secret>
npx convex env set RESEND_API_KEY <key>
npx convex env set AUTH_FROM_EMAIL <sender>
npx convex env set AUTH_REPLY_TO_EMAIL <reply-to>
```

## Quality gate before starting backend work

1. `npm run check`
2. confirm the Convex project name and deployment URL
3. confirm which auth path we are using
4. confirm which environment stores which values
5. confirm the backend schema matches the frontend workflow model

## Current Payrail-specific notes

- The frontend already supports settings-driven policies and dynamic quote rules.
- The current Convex schema was updated to reflect a real backend path, but queries and mutations still need to be built.
- The role switcher remains a demo/testing tool and should not be mistaken for production auth.

