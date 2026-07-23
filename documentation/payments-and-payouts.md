# Payments & Payouts (Paystack Transfers, live bank data, live geo data)

## Overview

This app has two genuinely different Paystack integrations, and they're
easy to conflate:

1. **Paystack Inline (checkout)** — collects a card payment _into_ the
   co-op's Paystack balance. Used for a member's own savings deposit
   (`/savings`, `src/lib/paystack.ts`). Needs only the **public** key.
2. **Paystack Transfers (payouts)** — sends money _out_ of the co-op's
   Paystack balance to a specific person's bank account. Used for loan
   disbursement and savings-withdrawal approval. Needs the **secret** key,
   server-side only, plus the recipient's real bank account details.

Inline checkout cannot be used for payouts — Paystack's Inline product has
no concept of "pay this out to someone else," it only ever charges a card
into the merchant's own balance. Realizing this replaced an earlier
assumption (visible in the reference screenshots this feature was built
against) that a small Paystack popup charge could stand in for
disbursement — it can't; a real payout needed the separate Transfers API,
which is what this document covers.

This also covers the two live, keyless external data sources — the bank
list and the country/state/city cascade — added alongside Transfers,
since they exist to support it (a payout needs a real bank code; the
address fields were the other place this app had static/free-text data
worth replacing with something live).

## Design Decisions

- **The secret key lives only in `.env.local` and is only ever read inside
  Next.js route handlers** (`src/app/api/paystack/*`), never in a
  client component. This is the same boundary already established for the
  Cloudinary secret (`src/app/api/upload/route.ts`) — the app already had
  one real server-side integration before this, so adding more route
  handlers wasn't a new architectural pattern, just reused.
- **Three route handlers, one per Paystack operation**:
  - `POST /api/paystack/resolve-account` — `{ accountNumber, bankCode }` →
    `{ accountName }`. Wraps `GET /bank/resolve`.
  - `POST /api/paystack/transfer` — `{ accountNumber, bankCode,
accountName, amount, reason }` → creates a Transfer Recipient, then
    initiates the actual Transfer. Returns `{ status, transferCode,
reference }`.
  - `POST /api/paystack/transfer/finalize` — `{ transferCode, otp }`, for
    the (live-mode-only, see below) OTP confirmation step.
  - `GET /api/paystack/banks` — the live bank list, described below.
  - Each returns a clear `{ error }` with a `503` when
    `PAYSTACK_SECRET_KEY` isn't set, the same "tell the user exactly
    what's missing" convention `isPaystackConfigured()` already
    established for the public key.
- **A withdrawal/disbursement approval attempts the real transfer
  _before_ mutating any state, and only proceeds if it succeeds.** Both
  `handleResolveRequest` (`admin-savings-view.tsx`) and `handleApprove`
  (`loans/request/[recordId]/page.tsx`) call `initiateTransfer()` first;
  a failure shows a clear error toast and returns early, leaving the
  request `Pending` so it can be retried — never marks something Approved
  when the money didn't actually move. Missing bank details on the
  recipient produce a distinct, clearer error ("hasn't verified their
  bank account yet") rather than attempting a transfer that would fail
  anyway.
- **Paystack's test-mode account-resolve quota is 3 real-bank lookups per
  day** — confirmed directly from Paystack's own error message
  (`"Test mode daily limit of 3 live bank resolves exceeded. Use test
bank codes 001 or upgrade to live mode."`) while building this. Bank
  code `001` ("Test Bank") is a special sandbox code: `/bank/resolve`
  accepts it unlimited times and always returns a fake
  `"TEST ACCOUNT {number}"` name — genuinely useful for demoing the
  _resolve_ flow without burning the real quota. It is **not** a real
  bank, so it's absent from Paystack's own `/bank` list and — confirmed
  directly against the API — creating a Transfer Recipient with it fails
  with `invalid_bank_code`. `src/app/api/paystack/banks/route.ts`
  prepends it to the live list anyway, clearly labeled
  "(sandbox preview only — not for payouts)", so it's available for the
  Verify step but nobody mistakes it for a way to actually receive money.
- **OTP finalization exists in code but wasn't exercised in test mode.**
  A real Paystack Transfer can come back requiring OTP confirmation
  (Paystack SMS's/emails a code to the business) before it completes —
  `/api/paystack/transfer/finalize` and `finalizeTransfer()` in
  `src/lib/paystack-transfer.ts` implement that path for correctness, but
  OTP is a live-mode safety feature; every test-mode transfer attempted
  while building this either succeeded or failed outright, never
  returning an `otp` status. No UI currently prompts for an OTP — see
  [Future Improvements](#future-improvements).
- **The live bank list replaced a hand-picked ~16-bank hardcoded array.**
  `GET /api/paystack/banks` fetches Paystack's real `/bank?currency=NGN`
  list server-side (secret key, so it can't be called client-side
  directly), filters to `active && !is_deleted && supports_transfer`,
  and is cached for an hour (`revalidate = 3600`) since it barely
  changes. This genuinely includes commercial banks, microfinance banks,
  and payment service banks (e.g. Airtel Smartcash PSB, 9mobile PSB) —
  confirmed by inspecting the real response — not just the "big four"
  a hand-picked list would have covered.
  `src/hooks/use-bank-list.ts` fetches it once per page load (a
  module-level cache, not per-mounted-form) since the list is identical
  for every user and doesn't need refetching each time a Select mounts.
- **The country/state/city cascade uses countriesnow.space** — free,
  keyless, and CORS-open (`Access-Control-Allow-Origin: *`), so
  `src/lib/geo-lookup.ts` calls it directly from the browser rather than
  proxying through a server route (no secret involved, nothing to hide).
  Its documented POST-with-JSON-body form now 301-redirects to an
  equivalent `GET .../states/q?country=...` URL — confirmed directly
  against the API while building this — so `geo-lookup.ts` calls that GET
  form directly instead of following a redirect on every request.
- **`LocationFields`** (`src/components/features/shared/location-fields.tsx`)
  is one shared component used by all four forms that capture an
  address (Profile, Add Member, Edit Member, Add Co-operative) — the
  cascading-clear behavior (picking a new country clears the state and
  city; picking a new state clears the city) only needs to be right in
  one place. It's a controlled component (`country`/`state`/`city` +
  `onXChange` props) — it owns its own fetch/loading state for the
  states/cities lists, but not the actual selected values, which live in
  each host form's `react-hook-form` state via `watch`/`setValue`.
- **Every address schema gained a required `city` field** — none of the
  four schemas previously had one (only free-text `state`). Existing seed
  data (`coop-data.ts`, `profile-data.ts`) was updated to use the live
  API's exact state naming (e.g. `"Lagos State"`, not `"Lagos"`) so a
  pre-filled record's State/City selects show a real pre-selected value
  instead of falling back to the placeholder.
- **The BVN identity-lookup flow was replaced with a real bank-account
  resolve, not just relabeled.** The original Add Member "Proceed" step
  (`src/lib/bvn-lookup.ts`, now deleted) looked a fake BVN up against a
  small hardcoded registry and auto-filled first/last name, phone, and
  email. A bank account resolve can only ever return an account holder's
  _name_ — not phone or email — so `add-member-form.tsx`'s "Verify" step
  now splits the resolved name naively into first/last
  (`splitResolvedName`) and leaves Phone/Email as ordinary fields the
  admin fills in themselves, rather than pretending they were verified
  too. The Profile page's BVN field went through the same swap, but
  stayed simpler: the resolved account name is just displayed as
  `accountName`, nothing else auto-fills from it.

## Where bank details live

Two different people-models, two different places bank details are
stored — same split that already existed for savings/loans data:

- **`CoopMember.bankCode` / `accountNumber` / `accountName`**
  (`coop-data.ts`) — for actual co-operative members (Jonathan Newman,
  Amaka Chukwu, …), captured by the admin via Add Member or Edit Member.
  Used for coop-scoped savings-withdrawal and loan-disbursement payouts.
- **`ProfileRecord.accountNumber` / `bankCode` / `accountName`**
  (`profile-data.ts`) — for the three demo logins' own personal details,
  captured via `/profile`. Used for the admin's own "My Savings"
  withdrawal payouts (the member role's own withdrawal payouts would use
  the same field, once/if a live member login submits one).

## Flow

```
Verify (Profile / Add Member / Edit Member):
  pick Bank (live list) → enter Account Number →
  "Verify" → POST /api/paystack/resolve-account → real or sandbox
  account name shown → stored as accountName

Approve a withdrawal/loan-disbursement request:
  → look up the recipient's bankCode/accountNumber/accountName
  → missing?  error toast, request stays Pending
  → POST /api/paystack/transfer (creates recipient, initiates transfer)
  → failure (e.g. quota exceeded)?  error toast, request stays Pending
  → success → mark Approved, create the ledger record, success toast
```

## Setup

Add to `.env.local` (gitignored, same as every other credential in this
app):

```
PAYSTACK_SECRET_KEY=sk_test_REDACTED
```

Use a **test-mode** secret key. Never expose this in a `NEXT_PUBLIC_*`
variable or any client-side code — unlike the Inline public key, this one
can move real money. Without it set, every route above fails gracefully
with a clear "Paystack isn't configured yet" toast instead of a silent
no-op.

## Components

- `src/app/api/paystack/resolve-account/route.ts`,
  `transfer/route.ts`, `transfer/finalize/route.ts`, `banks/route.ts` —
  the four server-side route handlers.
- `src/lib/bank-lookup.ts` — client wrappers (`resolveBankAccount`,
  `fetchBanks`) around the resolve and banks routes.
- `src/lib/paystack-transfer.ts` — client wrappers (`initiateTransfer`,
  `finalizeTransfer`) around the transfer routes.
- `src/lib/bank-data.ts` — `BankDef`/`BankAccountDetails` types,
  `findBankByCode`.
- `src/hooks/use-bank-list.ts` — the cached live bank list hook.
- `src/lib/geo-lookup.ts` — `fetchCountries`/`fetchStates`/`fetchCities`.
- `src/components/features/shared/location-fields.tsx` — the shared
  cascading Country/State/City component.

## Future Improvements

- **No OTP confirmation UI.** The finalize route/helper exist, but
  nothing prompts for an OTP if Paystack ever returns that status — see
  [Design Decisions](#design-decisions) for why this wasn't exercised in
  test mode. Worth adding once there's a live-mode account to test it
  against.
- **No webhook handling.** A production integration would confirm a
  transfer's final status via Paystack's webhook rather than trusting
  the synchronous `initiateTransfer()` response, the same
  client-trusted-callback honesty gap already flagged for Paystack
  Inline in [savings-page.md](./savings-page.md#design-decisions).
- **Bank details, once verified, aren't re-verified if the underlying
  bank account changes ownership** — there's no periodic re-check, same
  as any KYC field in this app.
