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
(pay application fee) → Awaiting Guarantor → Awaiting Approval (committee, in order)
  → Awaiting Acceptance (borrower) → Pending Disbursement → Active → Completed
        any open stage → Rejected          borrower says no → Declined
```

0. **Application fee.** Settings → Loan Settings → Application fee is either **Same fee for
   every loan** or **Different fee per loan type** (a fee on each type; 0 = no fee). With a fee
   per type, "+ New Loan" first asks the member to **choose a loan type**
   (`choose-loan-type-dialog.tsx`, showing each type's fee and whether it's already paid), then
   charges that type's fee. The form then opens with the type filled in and locked. A paid fee
   only counts for the type it was paid for. With one general fee, "+ New Loan" opens a
   checkout first (`checkout-dialog.tsx`, the preview's design: Card / Bank / Transfer / USSD).
   The card or bank details are entered in Paystack's (or Flutterwave's) own secure window,
   never in T-Coop; the server verifies the payment (`LoanApplicationFeeController`). A paid fee
   stays on file until an application uses it, so closing the form doesn't mean paying again.
1. **Apply.** Mode, loan type, amount and **how many months to repay over** (up to the loan
   type's maximum period). The co-op's rules apply: minimum amount, Times two up to N× savings,
   Within up to N% of savings, minimum membership months, minimum savings, and whether a member
   may have more than one loan. Times two needs the co-op's number of guarantors.
2. **Guarantors** (Times two only) each accept or decline; one decline rejects the loan.
3. **Loan committee.** The admin chooses who approves and in what order (any number of people,
   each with a title). Each one, in turn, **suggests an amount and repayment period** (never
   more than was asked for, never longer than the type allows) with an optional note. The last
   approver's figures are the approved terms. Any approver at their step, or the admin at any
   stage, can reject with a reason. With no committee set, the admin approves alone.
4. **Borrower accepts.** The borrower sees the approved amount and period (and what they asked
   for) and accepts or declines. Accepting asks where to pay: **their registered account**, or
   **another account**, which must be in their registered name: the bank is asked for the
   account's real name (Paystack resolve) and it must contain their first and last names.
5. **Disbursement.** An admin (or a role with Loans → Requests write) checks the summary and pays
   out **online** (Paystack transfer to the chosen account) or by **cheque** (upload a photo or
   scan, optional cheque number). The loan becomes **Active**.
6. **Repayment** as before (see [payments-and-payouts.md](./payments-and-payouts.md)).

### Committee rules

- Nobody approves a loan they borrow or guarantee: the admin covers that step.
- Committee members don't need a Loans permission to act; their seat is the authority. Loans
  waiting on them show at the top of their Loans page ("waiting for your approval").
- Every decision, with the suggested terms and what changed, is in the loan's trail
  (`loan_approvals`).

### Loan status cards

The Loans page opens with four cards (`loan-status-cards.tsx`): the co-op's loans for the admin
and staff, the member's own loans for a member. Click a card to filter the list to those loans;
click it again (or "Clear filter") to go back.

| Card            | Counts                                                                                                                                   |
| --------------- | ---------------------------------------------------------------------------------------------------------------------------------------- |
| **Still owed**  | What's left to repay on running (Active) loans, principal + interest — the dashboard's Loans figure                                      |
| **Repaid**      | Repaid so far, and how many loans are fully repaid                                                                                       |
| **In progress** | Loans not yet paid out: awaiting approval (guarantors or committee), awaiting the borrower, ready to pay out. Never part of "still owed" |
| **Overdue**     | Repayments past their due date and unpaid (instalment _i_ is due _i_ months after payout), with how many members (admin)                 |

The backend computes these per loan (`LoanBalances`: `amountRepaid`, `outstandingBalance`,
`overdueInstallments`, `overdueAmount`, `nextDueDate` on every loan record), so every screen uses
the same figures. The dashboard's Loans card shows the in-progress line underneath.

**Application fee:** each new loan needs its own paid fee. A fee is used up by the application
it pays for; a paid fee that hasn't been used (the member closed the form) carries over to their
next "New Loan" so nobody pays twice.

### Dividends

Settings → Loan Settings → Dividends: **a share of savings** (rate% of each member's savings),
**a share of loan interest** (rate% of the interest actually earned on loans, shared in
proportion to savings), or **none**, plus how often it's paid. The dashboard uses this
(`DividendCalculator`).

### Where payouts come from

The co-op's own Paystack account if it has connected one (Settings → Integrations), otherwise
the platform's. The online transfer reference is fixed per loan (`loan-<loanId>`), so retrying
can never pay the same loan twice.

### Recording a repayment by hand

When a borrower pays offline (cash or bank transfer), an admin or co-op staff member uses
**Record Repayment** on the loan. The amount is always the loan's next installment. A
**receipt is required**: a photo or PDF, up to 5 MB, uploaded with it. A note is optional. The
server refuses a manual repayment without a receipt
(`POST …/repayments/manual` `{ receiptUrl, note? }`). Each repayment stores the receipt, who
recorded it, and the note (V54). The Transactions tab shows a "View receipt" link next to it.

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
- **Import brings in existing loans, on the members' side only.** Members
  Loans → a loan type → Export / Import offers CSV/Excel/PDF export plus
  "Download import template" and "Import from template" — for the co-op
  admin and staff with write access to Members Loans. Each row (Membership
  ID, Amount, Loan Mode, optional Guarantor, Start Date, Repayments Made) is
  a loan already paid out offline: `POST /cooperatives/{id}/loans/import`
  (`LoanImportController`) creates it Active — Completed when every
  installment is paid — skips the guarantor/officer chain and payout, and
  records a repayment row per installment already paid so balances, overdue
  and borrower history are right. It doesn't touch the savings ledger.
  A member's own loans, and the admin's My Loans tab, are **export only**.
  New loans still go through Take a Loan.
  (`src/lib/loan-import.ts`, `src/app/(dashboard)/loans/type/[type]/page.tsx`.)
- **Payout happens on the server, not in the browser,** so an officer can't
  skip a step or double-pay, and the approval is only recorded once money
  has actually left.
