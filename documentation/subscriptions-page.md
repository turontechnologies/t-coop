# Subscriptions

## Overview

`/subscriptions` and `/subscriptions/[id]` are a new super-admin-only area,
alongside [Co-operatives](./co-operatives-page.md) and the super admin's
[Savings & Contributions](./savings-page.md) oversight page — same
`(dashboard)` route group, same auth guard, same shell.

## Purpose

Give a super admin one place to see every co-operative's subscription
standing (how much they've paid the platform, their recurring fee, when
they last paid, whether they're current or overdue), drill into any one
co-op's full payment history, and manually record a payment — mirroring
how manual savings entries work via "Upload Teller" on the Savings page.

## Design Decisions

- **Two-level structure, not nested under `/co-operatives`.** The mockup
  gave this its own distinct page (different breadcrumb, different header
  layout — no Members/Savings/Loans tabs) rather than a fourth tab on the
  existing co-op details page, so it got its own route tree:
  `/subscriptions` (all co-ops) → `/subscriptions/[id]` (one co-op's
  payment history).
- **The detail page reuses `CoopHeaderCard` unmodified** — same
  Co-op ID/Name/Contact Email/Phone/Admin/Address/Total Savings/Total
  Loan fields, same Disable/Activate Co-operative button, already used on
  `/co-operatives/[id]`. Reusing it exactly (rather than rebuilding a
  near-identical card to chase the mockup's slightly different button
  placement) keeps this screen behaviorally consistent with the rest of
  the admin oversight area — flow consistency mattered more here than a
  pixel match.
- **New data**: `Cooperative` gained `subscriptionFee: number` and
  `subscriptionPayments: CoopSubscriptionPayment[]` (`src/lib/coop-data.ts`).
  Each payment has its own `status: "Active" | "Overdue"` — not the
  payment's success/failure (a manually-recorded payment can't fail),
  but the co-op's subscription standing as of that payment. A co-op's
  current status is just its most recent payment's status
  (`coopSubscriptionStatus`); "Revenue Earned" is the sum of all its
  payments (`coopSubscriptionRevenue`); "Mgt Fees Received" on the
  top-level Quick Summary is that summed across every co-op
  (`allCoopsSubscriptionRevenue`) — same "derive, don't duplicate,
  document if illustrative" pattern already used for the Savings page's
  Transaction Fees Received figure.
- **"Manual Upload" only — no Paystack integration here.** Unlike
  savings/loan payouts, subscription payments are money coming _in_ from
  a co-op to the platform, recorded after the fact (bank transfer,
  cheque, etc.), not something this app initiates — so it's a simple
  form (amount + narration), not a real payment flow. The `method` field
  exists on the record (`"Manual" | "Paystack"`) so a future real
  Paystack collection flow could slot in without a schema change.
- **One shared modal, two contexts.** `ManualSubscriptionPaymentModal`
  takes an optional `coop` prop — omitted on the top-level page (shows a
  co-op picker `Select`), passed on the detail page (co-op is already
  fixed, no picker shown). Avoided building two near-identical modals.
- **Status filter values are `Active`/`Overdue`**, styled with the same
  green/red convention already used for `CoopStatus`
  (`Active`/`Disabled`) and `CoopMemberStatus` (`Active`/`Inactive`)
  elsewhere in the app, not a new color language.

## Routes

- `/subscriptions` — Quick Summary (Mgt Fees Received), a single
  "Subscriptions" tab, search + status filter + date range (filters by
  last-payment date), Manual Upload. Table: Co-op ID, Co-op Name, Revenue
  Earned, Subscription Fee, Date of last payment, Status. Row click →
  `/subscriptions/[id]`.
- `/subscriptions/[id]` — `CoopHeaderCard`, a single "Subscription
  History" tab, search, Manual Upload. Table: Payment Ref, Amount Paid,
  Payment Method, Payment Date, Narration, Status.

## Components

- `src/components/features/coop/super-admin-subscriptions-view.tsx` —
  top-level Quick Summary + tab + table wrapper, owns the upload modal.
- `src/components/features/coop/super-admin-subscriptions-table.tsx` —
  the all-co-ops table (search/status/date-range filters, pagination).
- `src/components/features/coop/subscription-history-table.tsx` — the
  per-co-op payment table (search, pagination).
- `src/components/features/coop/manual-subscription-payment-modal.tsx` —
  shared record-a-payment modal (co-op picker optional).
- `src/store/coop.store.ts` — `addSubscriptionPayment(coopId, payment)`
  prepends to that co-op's `subscriptionPayments`.

## Future Improvements

- No export (CSV/Excel/PDF) on either table yet — every other admin
  table in the app has `ExportImportMenu`; the reference mockup didn't
  show one here, but it'd be a natural, low-risk addition later.
- No real Paystack collection flow for subscription payments (see
  Design Decisions) — everything today is `method: "Manual"`.
- No automatic Overdue transition (e.g., a co-op doesn't flip from
  Active to Overdue just because 30 days passed) — status only changes
  when a new payment is recorded. A real backend would likely compute
  this from the billing cycle instead of trusting the last stored value.
