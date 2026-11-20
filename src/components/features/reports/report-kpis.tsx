"use client";

import type { ReactNode } from "react";
import { formatMoney } from "@/lib/format";
import type { FinancialReport } from "@/services/report.service";
import { Delta, TodayTag, pct } from "./report-ui";

/** "Net saved" — deposits minus withdrawals and charges. */
export const netSaved = (r: FinancialReport) =>
  r.savings.deposits -
  r.savings.withdrawals -
  r.income.savingsCharges -
  r.income.withdrawalFees;

/** Share of what's outstanding today that is more than 30 days late. */
export const par30Rate = (r: FinancialReport) =>
  r.loans.outstandingBalance
    ? r.loans.par30Amount / r.loans.outstandingBalance
    : 0;

function Tile({
  label,
  value,
  sub,
  delta,
  tag,
}: {
  label: string;
  value: string;
  sub?: string;
  delta?: ReactNode;
  tag?: ReactNode;
}) {
  return (
    <div className="min-w-0 rounded-2xl border border-border bg-card px-5 py-4 shadow-sm">
      <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
        {label}
        {tag}
      </div>
      <div className="mt-1.5 text-xl font-bold tracking-tight [overflow-wrap:anywhere] text-foreground lg:text-[1.45rem]">
        {value}
      </div>
      <div className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted-foreground/80">
        {delta}
        {sub ? <span>{sub}</span> : null}
      </div>
    </div>
  );
}

export function ReportKpis({
  report: r,
  previous: p,
}: {
  report: FinancialReport;
  previous: FinancialReport | null;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const rate = par30Rate(r);
  return (
    <div className="grid grid-cols-2 gap-2.5 sm:gap-3.5 md:grid-cols-3 2xl:grid-cols-6">
      <Tile
        label="Total savings"
        value={money(r.savings.closingBalance)}
        sub="at period end"
        delta={
          <Delta
            now={r.savings.closingBalance}
            before={p?.savings.closingBalance}
          />
        }
      />
      <Tile
        label="Net saved"
        value={money(netSaved(r))}
        sub="deposits minus withdrawals and charges"
        delta={<Delta now={netSaved(r)} before={p ? netSaved(p) : null} />}
      />
      <Tile
        label="Loans paid out"
        value={money(r.loans.principalPaidOut)}
        sub={`${r.loans.paidOut} ${r.loans.paidOut === 1 ? "loan" : "loans"}`}
        delta={
          <Delta
            now={r.loans.principalPaidOut}
            before={p?.loans.principalPaidOut}
          />
        }
      />
      <Tile
        label="Repayments collected"
        value={money(r.loans.repaymentsCollected)}
        sub={`${r.loans.repaymentCount} ${r.loans.repaymentCount === 1 ? "payment" : "payments"}`}
        delta={
          <Delta
            now={r.loans.repaymentsCollected}
            before={p?.loans.repaymentsCollected}
          />
        }
      />
      <Tile
        label="Income"
        value={money(r.income.total)}
        sub="interest, fees and charges"
        delta={<Delta now={r.income.total} before={p?.income.total} />}
      />
      <Tile
        label="Outstanding loans"
        tag={<TodayTag />}
        value={money(r.loans.outstandingBalance)}
        sub={`${r.loans.activeLoans} active · ${pct(rate)} over 30 days late`}
        delta={
          rate > 0.1 ? (
            <span className="rounded-full bg-red-100 px-1.5 py-0.5 text-xs font-bold text-red-700 dark:bg-red-950 dark:text-red-300">
              At risk
            </span>
          ) : null
        }
      />
    </div>
  );
}
