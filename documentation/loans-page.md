# Loans

## Overview

`/loans` (plus its detail route `/loans/[id]`) is the fourth real page in
the `(dashboard)` route group, alongside `/dashboard`, `/profile`, and
`/savings` — see [dashboard.md](./dashboard.md) and
[savings-page.md](./savings-page.md). It originally mirrored the
Savings & Contributions architecture in full, including the same role
split (member view / admin tabs / super-admin org-wide overview) — but,
same as `/savings`, that admin/super-admin oversight view turned out not
to match what should actually be there and has been removed pending a
correct reference design; see
[Admin/super-admin view removed](#adminsuper-admin-view-removed).

## Purpose

Let a member apply for a loan against their savings-derived eligibility,
see a live breakdown of what that loan will cost before committing, and
track it through to a full repayment schedule. Every member-facing screen
in the original reference set is covered: the summary + record table, the
"Take a Loan" modal (with its eligibility hint and live Loan Details
preview), the "Loan Successful" confirmation, and the individual loan
detail page with its Repayment Schedule / Transactions tabs.

## Admin/super-admin view removed

Same change, same reasoning, as `/savings` — see
[savings-page.md](./savings-page.md#adminsuper-admin-view-removed). The
admin's "Members Loans" / "My Loans" tab switcher and the super admin's
org-wide `<MembersLoansOverview>` are unwired: `/loans/page.tsx` now
renders `<MemberLoansView>` for `role === "member"` only and returns
`null` for every other role, and "Loans" lost its `href` for admin/
super_admin in `dashboard-nav.ts` (inert "coming soon" toast again).
`<MembersLoansOverview>` was not deleted — still in
`src/components/features/loans/members-loans-overview.tsx`, just no
longer imported — pending the corrected design.

## Design Decisions

- **Eligibility is derived from real savings data, not a fixed cap.**
  `computeEligibleAmount()` in `src/lib/loans-data.ts` takes a member's
  total savings (read live from `useSavingsStore`) and returns
  `min(loanType.maxAmount, max(totalSavings * 2, 10_000))`. This ties the
  two modules together the way a real co-operative would — save more,
  qualify for more — rather than every member seeing the same eligible
  amount regardless of history. The modal shows this figure the moment a
  Loan Type is picked and re-validates the amount field against it.
- **Loan terms are computed, not stored as static seed numbers alone.**
  `computeLoanTerms()` takes a `LoanTypeDef` (name, flat interest rate,
  max amount, duration in months) and an amount, and returns the full
  breakdown — total interest, total repayment, monthly repayment, number
  of installments — used identically by the "Take a Loan" live preview
  and by new records created through it. Interest is flat over the full
  term (`amount * rate/100`, split evenly across installments), not
  compounding — the simplest model that still produces a believable
  "Monthly Repayment" figure, appropriate for a mock system with no real
  underwriting behind it.
- **A loan submission is a mock approval request, not an instant credit.**
  Unlike `/savings` (real Paystack payment, instant "Success" record),
  "Proceed" in the Take a Loan modal simulates a submission delay
  (`setTimeout`, matching the app's established mock-latency convention)
  and then adds the record with `status: "Awaiting Approval"` — never
  `"Active"` on creation. The seed data (`INITIAL_LOAN_RECORDS`) includes
  examples of `Active`, `Completed`, and `Awaiting Approval` so the table,
  badges, and detail page all have real variety to render without needing
  a second flow to move a loan between statuses (there's no admin
  "approve loan" action yet — see [Future Improvements](#future-improvements)).
- **Repayment schedules and transactions are generated, not stored.**
  Rather than persist N installment rows per loan, `generateRepaymentSchedule()`
  derives the full schedule on demand from the loan record's amount, term,
  and a `repaymentsMade` counter: installments `<= repaymentsMade` are
  `Paid`, the rest are `Upcoming` or `Overdue` based on their computed due
  date vs. today — except loans still `Awaiting Approval`/`Rejected`,
  where every installment is `Pending` since repayment hasn't started.
  `generateLoanTransactions()` derives the Transactions tab the same way,
  by filtering the schedule down to the `Paid` installments and shaping
  them as transaction rows with a deterministic ID
  (`{loanId}-TXN-{installment}`). This keeps the data model small and
  guarantees the schedule and the transaction list can never disagree
  with each other, since one is a strict subset of the other.
- **The Take a Loan modal keeps the Proceed button natively enabled while
  busy, instead of using the `disabled` attribute.** This was a real bug
  caught during verification, not a preemptive choice: disabling a
  button that currently has focus makes the browser blur it, and Base UI's
  `Dialog` treats that focus escaping the dialog as an outside interaction
  and closes it — silently discarding the in-flight submission before its
  simulated delay even finished. The fix keeps `disabled` tied only to
  form validity (`!isValid`), and gates the busy state via
  `aria-disabled` + a `pointer-events-none` class + an early-return guard
  inside the click handler instead, so the button keeps focus (and the
  dialog stays open) for the full duration of the submission.
- **Reuses `<ExportImportMenu>` for export only.** Unlike Savings, Loans
  doesn't accept bulk import — a loan is an application with an
  eligibility check and a guarantor, not a ledger entry a member should be
  able to bulk-upload. `<ExportImportMenu>` is called without an
  `onImport` prop, which already hides the entire Import section (this
  behavior already existed in the shared component from the Savings
  build, unchanged here).
- **Same shadcn-everywhere standard as `/savings`.** Status filter and
  page-size use `Select`; the date range uses `Popover` + `Calendar`
  (`mode="range"`); pagination uses shadcn `Button`. The Take a Loan
  modal's Loan Type and Guarantor fields are also `Select`, not native
  `<select>`s — no new primitives were needed since `/savings` already
  added everything this page uses.
- **Tabs on the detail page are a new pattern for this app.** `/savings/[id]`
  has no tabs — one loan record maps to exactly one Savings transaction.
  A loan maps to a whole repayment plan, so `/loans/[id]` uses the shared
  `Tabs` primitive (already in `src/components/ui/tabs.tsx` from
  `/savings`' role-switch tabs) to separate "Repayment Schedule" (the
  full installment-by-installment plan) from "Transactions" (only the
  installments actually paid so far).

## Flow

```
/loans
  member          → <MemberLoansView> (their own records + "+ New Loan")
  admin / super_admin → null (nav item inert; see "Admin/super-admin view removed")

"+ New Loan" → <TakeLoanModal>
  pick Loan Type → shows eligible amount + rate/duration for that type
  enter Amount   → validated against eligible amount; Loan Details preview
                   (type, duration, amount, total repayment, monthly
                   repayment) appears live
  pick Guarantor → required before "Proceed" enables
  → "Proceed" → simulated submission delay → record added as
        "Awaiting Approval" → <LoanSuccessModal>, table/summary update live

Any row in a records table → /loans/[id] → Loan Details page
  (full record: type, amount, interest rate, duration, monthly/total
  repayment, date applied, member — linked to /profile — guarantor,
  status)
  Tabs: "Repayment Schedule" (amount/interest/total/due date/status per
        installment) | "Transactions" (paid installments as transaction
        rows: ID, amount, date, method, status)
```

## Components

- `src/app/(dashboard)/loans/page.tsx` — member-only role guard described
  above.
- `src/app/(dashboard)/loans/[id]/page.tsx` — the details page, with the
  Repayment Schedule / Transactions tabs.
- `src/components/features/loans/member-loans-view.tsx` — summary card,
  table, "+ New Loan"/"Export" actions, modal orchestration (this is
  where the submission simulation and `addRecord` call happen).
- `src/components/features/loans/members-loans-overview.tsx` — the former
  admin/super-admin aggregate-by-loan-type view; still present but no
  longer imported by `page.tsx` (see
  [Admin/super-admin view removed](#adminsuper-admin-view-removed)).
- `src/components/features/loans/loan-records-table.tsx` — search, status
  filter, date range, pagination, clickable rows (mirrors
  `savings-records-table.tsx`).
- `src/components/features/loans/take-loan-modal.tsx` /
  `loan-success-modal.tsx` — the two dialogs.
- `src/lib/loans-data.ts` — loan type definitions (name, flat interest
  rate, max amount, duration), `computeEligibleAmount`,
  `computeLoanTerms`, `generateRepaymentSchedule`,
  `generateLoanTransactions`, and seed records.
- `src/store/loans.store.ts` — the reactive record store (unpersisted,
  same lifetime convention as `savings.store.ts`).

## Animations

Same "lighter touch on data-dense screens" rule as
[savings-page.md](./savings-page.md#animations) — no per-field stagger on
the table. The two dialogs reuse the shared `Dialog` primitive's
scale+fade open/close, and the detail page's Repayment Schedule/
Transactions tabs use Base UI's `Tabs.Indicator` sliding highlight.

## Future Improvements

- **Rebuild the admin/super-admin view against a correct reference.**
  Top priority once that design is provided — see
  [Admin/super-admin view removed](#adminsuper-admin-view-removed).
- **No admin approval action.** A loan created via "Take a Loan" stays
  `Awaiting Approval` forever in this mock system — there's no UI yet for
  an admin/super-admin to move it to `Active` or `Rejected`. The seed data
  includes examples of every status so the UI has something real to
  render, but the transition itself isn't wired up.
- **No real disbursement or repayment collection.** Unlike `/savings`,
  there's no payment gateway involved here in either direction — a real
  system would need to actually pay out an approved loan and actually
  collect each installment (likely via the same Paystack integration,
  charging a saved payment method on each due date). `repaymentsMade` is
  a static seed number for now, not something that advances over time.
- **Guarantor list is a flat mock array** (`GUARANTORS` in
  `loans-data.ts`), not the real member directory — good enough to
  demonstrate the field, but a real version would pull from whatever
  members-directory data source the admin "Members Directory" nav item
  eventually uses.
