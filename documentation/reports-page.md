# Reports

## Overview

`/reports` is the co-operative's **financial report** — for the co-op admin
and any co-op staff whose role grants the **Reports** module (the four
officer roles get read access by default). Members and super admins don't
see it. Mobile has the same report under Settings → Co-operative Management →
Financial Report (view only; export is on web).

Backed by `GET /api/v1/cooperatives/{id}/reports/financial?from=&to=`
(`FinancialReportController`) — see the backend's `api-contracts.md` §8c.

## What it shows

Pick a date range (or This month / This year / Last 12 months):

- **Savings** — deposits and withdrawals (amount and count), money taken out
  of savings for Within loans and principal returned by their repayments,
  the net change, and total savings at the end of the period.
- **Loans** — applications, loans paid out (principal, and what reached
  members after charges), rejections, repayments collected, and — as of
  today — active loans, the outstanding balance and how much of it is
  overdue.
- **Income** — interest earned (each repayment's interest share), loan
  charges, savings charges on online deposits, withdrawal fees, and the
  total.
- **Month by month** chart — deposits, withdrawals, loans paid out,
  repayments.
- **By loan type** — loans paid out, principal, repaid, outstanding.
- **Overdue loans** — who, which loan, how much, how many installments late,
  overdue since when; each links to the loan's request page.

**Export:** Excel (Summary, Monthly, By loan type and Overdue loans sheets)
or PDF (`src/lib/financial-report-export.ts`). PDF amounts use the currency
code (e.g. "NGN 1,234.00") because the PDF fonts can't draw "₦".

## Key files

- `src/app/(dashboard)/reports/page.tsx`
- `src/services/report.service.ts`, `src/hooks/use-financial-report.ts`
- `src/lib/financial-report-export.ts`
- Mobile: `src/app/(app)/settings/reports.tsx`

## Design decisions

- **Built from the same ledgers as every other screen** (savings records,
  loans, loan repayments, withdrawal requests), so the report always
  reconciles with the Savings and Loans pages.
- **Flows vs balances.** Money in/out covers the chosen range; outstanding
  and overdue figures are always as of today, which is what an officer
  acts on.
- **Overdue** means an installment's due date (monthly from the payout date)
  has passed without a repayment.
