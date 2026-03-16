# Backend Handoff Notes — Payrail

## Current Backend Direction

The frontend has already moved to a settings-driven `v2` workflow shape. Backend work should preserve that model rather than re-invent it.

Key expectations:

- approval policies are dynamic by company + category + amount
- quote requirements are policy-driven
- approval step counts are fully dynamic
- only one step is `pending` at a time
- future steps remain `waiting`
- Finance is the payout phase after business approvals
- requests store a policy snapshot at submission time
- settings changes affect new or resubmitted requests, not in-flight requests
- backend mutations own validation and state transitions

## Workflow Rules The Backend Must Own

Do not rely on frontend-only enforcement for these rules:

- policy matching
- approval-step generation
- role/company permission checks
- quote-count enforcement
- selected-vendor justification rules
- recall/resubmission permissions
- per-line-item payment transitions
- audit timeline creation

Suggested lifecycle:

`draft -> in_approval -> awaiting_finance -> partially_paid -> paid`

Exception paths:

- `in_approval -> rejected`
- `in_approval -> recalled`
- `rejected/recalled -> in_approval` after resubmission

## Saved Account Numbers (Per-User)

### Requirement
Each user should be able to **save account numbers** they have previously entered when creating payment requests. These saved accounts should be available for quick selection in future requests.

### Key Rules
- **Per-user storage**: Saved account numbers are tied to the individual user who entered them.
- **Privacy**: A user's saved account numbers are **NOT shared** with or visible to any other user in the system, regardless of role (Admin, Supervisor, Finance, etc.).
- **CRUD operations**:
  - **Create**: When a user submits a payment request, any new account numbers entered should be offered to save for future use.
  - **Read**: On the New Payment Request form, users should see their own saved accounts as suggestions/autocomplete when entering account numbers.
  - **Delete**: Users must be able to remove any of their saved account numbers at any time.
- **Data model suggestion**:
  ```
  saved_accounts {
    id: UUID
    user_id: FK → users.id
    payee_name: string
    bank: string
    account_number: string (encrypted at rest)
    created_at: timestamp
    last_used_at: timestamp
  }
  ```
- **Security**: Account numbers should be encrypted at rest in the database. Only the owning user can query their own saved accounts.

### Frontend Context
- The current frontend form (`RequestForm.jsx`) supports multiple account numbers per payee.
- On submit, multi-account payees are flattened into individual line items for the approval workflow.
- The frontend will need an API endpoint to fetch saved accounts for the current user and another to delete them.

## Setup Reminders Before Backend Buildout

These came from the setup lessons we wanted applied before developing Payrail further:

1. confirm the actual Convex project name and deployment URL before wiring queries
2. keep frontend code, Convex deployment, and generated bindings aligned
3. run Convex sync after backend module changes before trusting frontend errors
4. keep backend secrets in Convex env, not in the Vite `.env`

Useful commands:

```bash
npm run convex:sync
npm run convex:env:list
npm run convex:data
```

---

## HTTP Confirmation Link

> **TODO**: Replace the current mock confirmation flow with an actual HTTP link for payment confirmation. (Flagged by the team — implementation pending.)

---

*Last updated: 2026-03-14*
