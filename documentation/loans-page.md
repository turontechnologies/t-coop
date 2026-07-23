# Loans

## Overview

`/loans` (plus its detail route `/loans/[id]`) is the fourth real page in
the `(dashboard)` route group, alongside `/dashboard`, `/profile`, and
`/savings` — see [dashboard.md](./dashboard.md) and
[savings-page.md](./savings-page.md).

**Member and admin are both built; super_admin is still inert.** The
member experience described in most of this document is unchanged. The
admin role now has its own real "Loans" page — see
[Admin view](#admin-view) below — built the same way `/savings`' admin
view was: Quick Summary, tabs, a per-type drill-down reusing the
super-admin co-op components via an optional `basePath`. Super admin's
"Loans" nav item still has no `href`; the equivalent oversight already
exists per co-operative under `/co-operatives/[id]/loans/...`.

## Purpose

Let a member apply for a loan against their savings-derived eligibility,
see a live breakdown of what that loan will cost before committing, and
track it through to a full repayment schedule. Every member-facing screen
in the original reference set is covered: the summary + record table, the
"Take a Loan" modal (with its eligibility hint and live Loan Details
preview), the "Loan Successful" confirmation, and the individual loan
detail page with its Repayment Schedule / Transactions tabs.

## Admin view

An admin manages loans for their whole co-operative from the same
`/loans` route (branched by role in `page.tsx`): a page-level Quick
Summary (Total Loans across every member + the admin's own personal My
Loans total) above three tabs — **Requests**, **Members Loans**, and
**My Loans** (Requests first, matching the reference — it's the queue
that actually needs attention). "+ New Loan" only appears on the My
Loans tab, opening the exact same `<TakeLoanModal>` a member gets — there
is no admin-side manual loan-entry action, since nothing in the request
described one (unlike Savings' Upload Teller, which was explicitly
asked for).

This replaces an earlier, unwired admin/super-admin oversight view
(`<MembersLoansOverview>` + a tab switcher) that predated a correct
reference design. `<MembersLoansOverview>` is still present in
`src/components/features/loans/members-loans-overview.tsx` but no longer
imported anywhere — `AdminLoansView` was built fresh instead, reusing the
co-operative oversight components (`CoopLoansSummaryTable`,
`CoopLoanTypeRecordsTable`) the same way `AdminSavingsView` reuses their
Savings equivalents.

### The approval pipeline: Guarantor, then Admin

A co-op loan (`CoopLoanRecord`) now moves through two pending stages
before it's resolved:

```
Awaiting Guarantor → Awaiting Admin → Active (approved) | Rejected
```

- **Awaiting Guarantor**: the nominated guarantor needs to accept or
  decline standing for the loan. The admin acts on this from a unified
  Requests queue (see [Design Decisions](#design-decisions) for why there's
  no separate guarantor login) — clicking a request in this stage shows a
  guarantor profile card alongside the Loan Details, with **Accept
  Request** (optionally attaching proof of income, e.g. a payslip) or
  **Reject Request**.
- **Awaiting Admin**: once the guarantor accepts, the admin makes the
  final call — **Approve Request** attempts a real Paystack Transfer of
  the approved amount to the member's verified bank account first, and
  only marks the loan `Active` if that transfer actually succeeds (a
  missing bank account or a failed transfer shows a clear error and
  leaves the loan `Awaiting Admin`, so it can be retried — see
  [payments-and-payouts.md](./payments-and-payouts.md) for the full
  mechanism, shared with Savings' withdrawal-approval payouts), or
  **Reject Request**, which _requires_ a reason before the button
  enables, stored as `rejectionReason` and shown wherever the record is
  viewed afterward.

This intentionally does **not** build the full pipeline implied by the
reference screenshots (`Awaiting Processing Fee` with a real Paystack
charge, a separate `Awaiting Approver 1` stage) — those screens
contradicted each other (a ₦100 Paystack charge vs. a "₦5,000 processing
fee" success message) and didn't clearly map onto a single admin's
final decision the way the request explicitly described ("if the admin
want to pay the member the approved loan and if rejecting it should pass
a message to the member reason for rejection"). Guarantor + Admin is the
scope that was actually asked for.

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
- **The guarantor decision is made by the admin, not a separate guarantor
  login.** This app has exactly three roles/logins (super_admin, admin,
  member) — there's no fourth "guarantor" identity to sign in as, and
  building one wasn't asked for. So `respondToGuarantorRequest` is an
  admin action taken _on behalf of_ whoever is nominated: the admin's
  unified Requests tab shows every pending request regardless of stage,
  and the request detail page renders the guarantor's own profile card
  (looked up by matching `guarantorName` against a real `CoopMember`, when
  one exists) purely as _context_ for the admin's decision, not as a
  login-gated action only that person could take. When the name doesn't
  match any real member (e.g. a co-op's own `adminName`, who isn't
  necessarily listed as a `CoopMember`), the card shows just the name and
  says so honestly, rather than fabricating an email/country/etc.
- **`CoopLoanStatus` replaced the single generic `"Awaiting Approval"`
  with two specific stages** (`"Awaiting Guarantor"`, `"Awaiting Admin"`),
  and `generateRepaymentSchedule`/`generateLoanTransactions` in
  `loans-data.ts` were generalized to accept any loan-shaped object
  (`status: string`, checked via `.startsWith("Awaiting")` for "not
  disbursed yet") rather than the exact legacy `LoanRecord` type — needed
  because `CoopLoanRecord` and the personal `LoanRecord` no longer share
  an identical status union, so the functions had to stop assuming one.
  A new shared `coopLoanStatusBadgeVariant()` helper in `coop-data.ts`
  replaced three separate copies of the same badge-color logic that would
  otherwise have needed updating in three places every time a status is
  added.
- **Withdrawal-style negative amounts weren't needed here** (unlike
  Savings' request approvals) — a loan's `amount` is always positive
  the whole way through; only its `status` changes as it moves through
  the pipeline.
- **"+ New Loan" is My Loans-only; there's no Members Loans equivalent of
  Upload Teller.** Savings' Upload Teller exists because an admin
  recording a _manual, already-happened_ deposit for someone else is a
  real, distinct action from that member paying via Paystack. A loan
  doesn't have an equivalent "the admin already gave them the money,
  just log it" moment — every co-op loan enters through the same
  application → guarantor → admin pipeline, so there's deliberately no
  second creation path to keep in sync with it.

## Flow

```
/loans
  member      → <MemberLoansView> (their own records + "+ New Loan")
  admin       → <AdminLoansView> (Quick Summary + Requests/Members Loans/My Loans tabs)
  super_admin → null (nav item inert)

Member "+ New Loan" → <TakeLoanModal>
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

--- Admin-only ---

Members Loans tab → <CoopLoansSummaryTable> (by loan type)
  → click a type row → /loans/type/[type] → per-type records for every member
      → click a record → /loans/record/[recordId] → Loan Details + Repayment
        Schedule/Transactions tabs (same shape as the member's own detail page)

My Loans tab → <MemberLoansView showSummary={false}> for the admin's own
  record — identical Take-a-Loan flow as a member, driven by the
  page-level "+ New Loan" button

Requests tab → <LoanRequestsTable> (every loan Awaiting Guarantor/Awaiting
  Admin, across every member and type)
  → click a row → /loans/request/[recordId]
      status "Awaiting Guarantor" → guarantor profile card + Loan Details
        "Accept Request" (optional payslip upload) → status → "Awaiting Admin"
        "Reject Request" (simple confirm) → status → "Rejected"
      status "Awaiting Admin" → Loan Details only
        "Approve Request" (confirm) → real Paystack Transfer to the
          borrower's verified bank account → only on success: status → "Active"
          (failure → error toast, stays "Awaiting Admin")
        "Reject Request" (reason required) → status → "Rejected", reason stored
```

## Components

- `src/app/(dashboard)/loans/page.tsx` — role branch: member/admin/
  super_admin, described above.
- `src/app/(dashboard)/loans/[id]/page.tsx` — the member's own details
  page, with the Repayment Schedule / Transactions tabs.
- `src/app/(dashboard)/loans/type/[type]/page.tsx` — admin-only: all
  members' records for one loan type.
- `src/app/(dashboard)/loans/record/[recordId]/page.tsx` — admin-only:
  single loan details + Repayment Schedule/Transactions tabs, mirrors the
  super-admin co-op equivalent.
- `src/app/(dashboard)/loans/request/[recordId]/page.tsx` — admin-only:
  the guarantor/admin decision page described above.
- `src/components/features/loans/member-loans-view.tsx` — summary card,
  table, "+ New Loan"/"Export" actions, modal orchestration (this is
  where the submission simulation and `addRecord` call happen); see the
  `showSummary`/`takeOpen`/`onTakeOpenChange` props added for admin reuse.
- `src/components/features/loans/admin-loans-view.tsx` — the admin
  orchestrator: Quick Summary cards, the three tabs, "+ New Loan" shown
  only on My Loans.
- `src/components/features/loans/loan-requests-table.tsx` — the Requests
  tab's flat, all-types table of pending requests.
- `src/components/features/loans/members-loans-overview.tsx` — an
  earlier, unwired admin aggregate view; no longer imported anywhere (see
  [Admin view](#admin-view)) — candidate for deletion in a future cleanup.
- `src/components/features/loans/loan-records-table.tsx` — search, status
  filter, date range, pagination, clickable rows (mirrors
  `savings-records-table.tsx`).
- `src/components/features/loans/take-loan-modal.tsx` /
  `loan-success-modal.tsx` — the two dialogs.
- `src/components/features/coop/coop-loans-summary-table.tsx` /
  `coop-loan-type-records-table.tsx` — the by-type aggregate and per-type
  records table, shared between the super-admin co-op oversight view and
  the admin's Members Loans tab via an optional `basePath` prop.
- `src/lib/loans-data.ts` — loan type definitions (name, flat interest
  rate, max amount, duration), `computeEligibleAmount`,
  `computeLoanTerms`, `generateRepaymentSchedule`,
  `generateLoanTransactions` (now generalized over any loan-shaped
  object, not just the legacy `LoanRecord`), and seed records.
- `src/lib/coop-data.ts` — `CoopLoanStatus`'s two staged statuses,
  `CoopLoanRecord.rejectionReason`/`guarantorAcceptedAt`/
  `guarantorDocumentUrl`, `coopLoanStatusBadgeVariant` (the shared
  badge-color helper), and the seeded `coop-loan-5` (Awaiting Guarantor)
  request used to demo the pipeline.
- `src/lib/file-to-data-url.ts` — reused as-is from Notice Board/Savings
  for the optional payslip upload on guarantor acceptance.
- `src/store/loans.store.ts` — the reactive record store for the
  member/admin's own personal loans (unpersisted, same lifetime
  convention as `savings.store.ts`).
- `src/store/coop.store.ts` — `respondToGuarantorRequest` and
  `resolveLoanRequest` mutators driving the approval pipeline.

## Animations

Same "lighter touch on data-dense screens" rule as
[savings-page.md](./savings-page.md#animations) — no per-field stagger on
the table. The two dialogs reuse the shared `Dialog` primitive's
scale+fade open/close, and the detail page's Repayment Schedule/
Transactions tabs use Base UI's `Tabs.Indicator` sliding highlight.

## Future Improvements

- **The member-facing "Take a Loan" flow (legacy `LoanRecord`) still has
  no admin approval action.** A loan created via that flow stays
  `Awaiting Approval` forever — it's a separate, older data model from
  the co-op `CoopLoanRecord` pipeline this document's new Admin view
  actually resolves. Folding the personal flow into the same
  guarantor/admin pipeline (or building an equivalent for it) is the
  natural next step, but was out of scope here since "My Loans" was
  explicitly asked to stay identical to the member's existing flow.
- **A dedicated super-admin `/loans` view**, if ever requested — today
  super admin's oversight equivalent lives per-co-operative under
  `/co-operatives/[id]/loans/...` (see
  [co-operatives-page.md](./co-operatives-page.md)).
- **Disbursement is real (a genuine Paystack Transfer); repayment
  collection is not.** Approving a co-op loan request now attempts a real
  payout — see [payments-and-payouts.md](./payments-and-payouts.md) — but
  nothing collects the repayments afterward; `repaymentsMade` is still a
  static seed number, not something that advances over time or gets
  charged on each due date.
- **Guarantor list is a flat mock array** (`GUARANTORS` in
  `loans-data.ts`), not the real member directory — good enough to
  demonstrate the field, but a real version would pull from whatever
  members-directory data source the admin "Members Directory" nav item
  eventually uses. The co-op guarantor pipeline instead matches
  `guarantorName` against real `CoopMember` records when possible (see
  [Design Decisions](#design-decisions)), which is a step closer but
  still name-matching rather than a real reference/ID relationship.
- **The full multi-stage pipeline implied by the reference screenshots**
  (a real Paystack-charged processing fee, a separate "Approver 1"
  stage) wasn't built — see [Admin view](#admin-view) for why. Worth
  revisiting if a coherent, non-contradictory reference for those stages
  is provided.
