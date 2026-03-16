# Payrail

Payrail is a settings-driven payment approval prototype for multi-company operations teams. The current app is a React + Vite frontend simulator with:

- dynamic approval policies by company, category, and amount
- quote-compliance rules that change per policy
- per-line-item finance disbursement
- a settings workspace for companies, users, policies, request rules, and saved accounts
- seeded demo data for user testing

The frontend is still local-state driven. Convex has only a schema draft right now, so the backend is not wired yet.

## Current product shape

- Workspace/repo name: `PAYRAIL`
- Package name: `payrail`
- Current user-facing app label: `Rork Payment Hub`
- Backend source of truth target: Convex
- Auth stack recommendation for the real app: Convex Auth + Better Auth

## Quick start

1. Install dependencies:

```bash
npm install
```

2. Create local envs from the example file:

```bash
cp .env.example .env
```

3. Start the app:

```bash
npm run dev
```

4. Run the local quality check before handoff:

```bash
npm run check
```

## Useful scripts

- `npm run dev` - start the Vite dev server
- `npm run build` - production build
- `npm run lint` - lint the codebase
- `npm run check` - lint + build
- `npm run convex:sync` - regenerate/sync Convex after backend changes
- `npm run convex:env:list` - inspect Convex env vars
- `npm run convex:data` - inspect Convex data tables

## Environment map

Frontend `.env` values should only contain non-secret client config such as:

```env
VITE_CONVEX_URL=
VITE_CONVEX_SITE_URL=
VITE_APP_ENV=development
```

Backend secrets should be stored in Convex, not in Vite env files:

```bash
npx convex env set BETTER_AUTH_SECRET <random-secret>
npx convex env set RESEND_API_KEY <key>
npx convex env set AUTH_FROM_EMAIL <sender>
npx convex env set AUTH_REPLY_TO_EMAIL <reply-to>
```

## Development rules we are adopting now

These come from the setup lessons that triggered this repo cleanup:

1. Keep the local frontend, generated Convex API, and deployed Convex functions aligned.
2. Run `npm run convex:sync` after adding or changing Convex modules before trusting frontend errors.
3. Treat backend rules as the real contract for:
   - policy matching
   - approval permissions
   - quote validation
   - recall/resubmission rules
   - payout state transitions
4. Store a policy snapshot on each submitted request so settings changes only affect new or resubmitted requests.
5. Keep demo-only tools such as role switching clearly separated from the real product flow.

## Read these before building the backend

- [PAYRAIL_SETUP_FOUNDATION.md](./PAYRAIL_SETUP_FOUNDATION.md)
- [PAYRAIL_THREAD_HANDOFF.md](./PAYRAIL_THREAD_HANDOFF.md)
- [BACKEND_HANDOFF.md](./BACKEND_HANDOFF.md)
- [convex/schema.ts](./convex/schema.ts)

## Current repo status

- Frontend workflow engine: implemented in local state
- Settings UI: implemented
- Saved accounts UI: implemented, backend persistence still pending
- Convex backend scaffold: `schema`, `requests`, `settings`, and `seed` modules are now in place
- Auth, email verification, and real persistence: not wired yet
- Convex codegen still needs a real deployment connection (`npx convex dev`) before generated bindings can be produced
