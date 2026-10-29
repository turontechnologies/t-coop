# Loans

## Overview

`/loans` and its detail routes cover the whole loan lifecycle — applying,
guarantor sign-off, the officer approval chain, automatic payout, and
repayment. Everything runs against the real backend
(`LoanController`, `LoanSelfServiceController`, `LoanRepaymentController`);
there is no mock mode.

`LoansPage` branches by role:

- **member** → `<MemberLoansView>`: their own loans + "+ New Loan".
- **admin** and **co-op staff** (any member holding a co-op role, including
  the four officers) → `<AdminLoansView>`: Quick Summary above three tabs —
  **Requests**, **Members Loans**, **My Loans**. Which tabs a staff member
  sees follows their role's Loans permissions.
- **super_admin** → `<SuperAdminLoansView>`: platform-wide totals and every
  co-op's loan figures (`GET /api/v1/cooperatives`). Super admins oversee but
  never act on a loan.

## The loan lifecycle

```
Awaiting Guarantor → Awaiting Vice President → Awaiting Treasurer
  → Awaiting Secretary → Active (paid out) → Completed
          any open stage → Rejected
```

1. **Apply.** A member picks a **mode**, a loan type and an amount:
   - **Times two** — up to half their savings (their savings must be at
     least twice the loan). Needs a **guarantor**: an _active member of the
     same co-op_, not the applicant — the picker only lists those, and the
     backend rejects anything else.
   - **Within** — borrowed from their own savings, up to what they've
     saved. No guarantor: it goes straight to the Vice President. The
     payout is deducted from their savings and the principal part of each
     repayment goes back into them.

   Both are capped by the loan type's maximum, and **every loan charges the
   loan type's interest** — a percentage, a fixed amount, or none for a
   "No Interest" type. Every co-op has a **Household Loan** type by default.
   This is the only place a guarantor is named; joining the co-op needs
   none (see [members-directory-page.md](./members-directory-page.md)).

2. **Guarantor** (Times two only). Only the named guarantor can accept
   (optionally attaching proof of income) or decline. Declining rejects the
   loan.
3. **Officer approvals.** The loan then goes to the co-op's **Vice
   President**, then **Treasurer**, then **Secretary** — one approval each,
   in that order. Each officer is notified when it's their turn.
4. **Payout.** The Secretary's approval immediately sends the loan to the
   borrower's saved bank account — principal minus the combined co-op +
   platform loan charge — as a server-side Paystack transfer. Only when
   Paystack accepts it does the loan become **Active**. If the payout fails
   (no bank account, no Paystack set up, Paystack refuses), nothing changes
   and the Secretary sees the reason and can try again.
5. **Repayment.** The borrower pays each fixed installment online, or an
   admin/officer records one paid offline; the final installment completes
   the loan (see [payments-and-payouts.md](./payments-and-payouts.md)).

### Officer rules

- Every co-op has four fixed officer roles — **President, Vice President,
  Treasurer, Secretary** — managed in Settings → User Management like any
  co-op role, but they can't be renamed, deactivated, or deleted, and each
  is held by one member at a time.
- At each step only that office's holder can approve or reject.
- **A vacant office is covered by the co-op admin.** The same applies when
  the office holder is the loan's own borrower or guarantor — nobody acts on
  a loan they're party to.
- **The President can reject at any open stage** (including while it awaits
  the guarantor) but doesn't approve.
- Every decision is recorded in the loan's approval trail
  (`loan_approvals`), including whether the admin acted as cover.

### Where payouts come from

The co-op's own Paystack account if it has connected one (co-op admin's
Settings → Integrations), otherwise the platform's. The transfer reference
is fixed per loan (`loan-<loanId>`), so retrying an approval can never pay
the same loan twice. The paying account must allow API transfers without an
OTP (Paystack Settings → Preferences).

## Borrower history

Before approving, officers see the **borrower history** on the request page
(and on a member's profile → Loan History tab, web; under the approvals
timeline on mobile): savings, outstanding balance, active loans, on-time
repayment rate, late repayments, overdue installments, and every past loan
with its full repayment record (paid date vs due date). A warning appears
when the member already owes money — in red when something is overdue.
(`GET /cooperatives/{id}/members/{memberId}/loan-history`,
`borrower-history-card.tsx`.)

## Screens

```
/loans
  Requests tab → every loan still awaiting the guarantor or an officer
    → /loans/request/[recordId]
        Loan Details (+ guarantor profile card while awaiting the guarantor)
        Guarantor only:        Accept / Reject
        Whoever can act now:   Approve / Reject, labelled "Acting as …"
                               (Secretary's approve dialog states the exact
                                payout amount and that it can't be undone)
        Approvals timeline:    VP → Treasurer → Secretary, who holds each
                               office, who decided what and when
  Members Loans tab → by-type summary → /loans/type/[type] → /loans/record/[recordId]
  My Loans tab → the signed-in member's own loans + "+ New Loan"

/loans/[id] — a member's own loan: details, Repayment Schedule /
  Transactions tabs, repayment panel. Shows a "Review as …" link for anyone
  who can currently act on it.
```

What a caller can do on a loan comes from
`GET /cooperatives/{id}/loans/{loanId}/approvals` (`canApprove`,
`canReject`, `actingAs`) — the page never works it out itself, so the
buttons always match what the backend will accept.

## Key files

- `src/app/(dashboard)/loans/page.tsx` — role branch.
- `src/app/(dashboard)/loans/request/[recordId]/page.tsx` — guarantor and
  officer decisions, approvals timeline.
- `src/app/(dashboard)/loans/[id]/page.tsx` — member's loan detail.
- `src/components/features/loans/take-loan-modal.tsx` — application form;
  guarantor picker limited to active co-op members.
- `src/components/features/loans/admin-loans-view.tsx`,
  `member-loans-view.tsx`, `loan-requests-table.tsx`,
  `loan-records-table.tsx`, `loan-repayment-panel.tsx`.
- `src/services/loan-self.service.ts` + `src/hooks/use-loans-self.ts` —
  apply, guarantor response, approvals, decision.
- `src/lib/coop-data.ts` — `CoopLoanStatus`, `PENDING_LOAN_STATUSES`,
  `coopLoanStatusBadgeVariant`.
- `src/lib/loans-data.ts` — eligibility/terms helpers and the derived
  repayment schedule used for display.

## Design decisions

- **The limit comes from the mode**, computed server-side from the member's
  real savings (`LoanEligibility`); the loan type's old "eligibility %" no
  longer applies and isn't shown. The modal mirrors it for a live hint.
- **Interest follows the loan type** (percentage, fixed amount, or none),
  flat over the term and split evenly across installments; every repayment
  is exactly one installment — no partial amounts.
- **No bulk loan import.** A loan is an application with an eligibility
  check and a guarantor, not a ledger row.
- **Payout happens on the server, not in the browser,** so an officer can't
  skip a step or double-pay, and the approval is only recorded once money
  has actually left.
