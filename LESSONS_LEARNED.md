# Lessons Learned

These are the setup and architecture lessons we want loaded before continuing Payrail.

## 1. Configuration drift breaks trust fast
The biggest risk is not feature work. It is drift between:
- the local frontend
- Convex functions
- generated Convex bindings
- auth/email setup
- environment variables

Rule:
- Before assuming the app is broken, confirm those five pieces still match.

## 2. Frontend env and backend env must stay separate
Public client config belongs in Vite env files. Secrets do not.

Rule:
- Keep only public values in `.env`.
- Keep backend secrets in Convex env.

## 3. Backend owns the workflow contract
This app has dynamic policy logic, approval steps, quote rules, and payout states. If the frontend owns that logic, it will drift.

Rule:
- Policy matching, approval generation, quote enforcement, permission checks, recall/resubmission rules, and payout transitions must live in Convex.

## 4. Requests need policy snapshots
Settings will change over time. Requests already in flight cannot silently change meaning underneath users.

Rule:
- Snapshot the matched policy onto each submitted request.
- New or resubmitted requests can pick up newer policy versions.

## 5. Approval flow must stay linear and explicit
Only one step should be actionable at a time.

Rule:
- Keep one approval step `pending`.
- Keep future steps `waiting`.
- Advance the next step only from backend actions.

## 6. Finance is a distinct phase
Finance is not just another approval label. It is the payout phase after business approvals.

Rule:
- Model finance transitions separately and clearly in backend workflow logic.

## 7. Saved accounts are user-private data
Saved beneficiary accounts should help the request form, but they should not leak across users.

Rule:
- Saved accounts are private to the owning user.
- Autocomplete must only return the current user's saved accounts.
- In the real backend, treat this data as sensitive.

## 8. Sync Convex before trusting frontend errors
A lot of “frontend” issues are really stale generated bindings or unsynced backend modules.

Rule:
- After backend changes, run `npm run convex:sync`.
- Verify generated API files before chasing UI bugs.

## 9. Auth should come after the backend contract is clear
Auth adds complexity. It should not land before the core workflow is stable enough to protect.

Rule:
- Finish the workflow engine and persistence model before adding real auth.
- When auth starts, prefer `Convex Auth + Better Auth`.

## 10. Email should wait for real sender setup
Email flows cause noise if the sender/domain setup is not ready.

Rule:
- Add `Resend` only after a real sender domain exists.
- Do not build email-heavy flows on placeholder infrastructure.

## 11. Demo tools must stay visibly demo-only
Role switchers and seeded local state are useful while prototyping, but they can easily be mistaken for real product behavior.

Rule:
- Keep demo/testing tools separate from production paths.
- Do not let demo shortcuts become permanent business logic.

## 12. Build the smallest trustworthy backend first
The safest path is not “all features quickly.” It is a clear backend contract that the frontend can grow around.

Rule:
- Start with schema, settings persistence, request submission, approvals, rejections, resubmission, finance payout, and saved accounts.
- Add auth and email only after the core workflow is reliable.
