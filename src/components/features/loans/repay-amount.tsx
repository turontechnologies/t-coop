"use client";

import { useId, useMemo } from "react";
import { motion } from "framer-motion";
import { CalendarCheck, CircleCheck, Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLong, formatMoney } from "@/lib/format";
import {
  amountToClear,
  coverageOf,
  formatMonths,
  installmentsCovered,
  loanProgress,
  type LoanTerms,
} from "@/lib/loan-progress";
import { cn } from "@/lib/utils";

/** Typed text → amount ("12,500.50" → 12500.5); 0 when empty. */
export function parseAmount(value: string): number {
  const number = Number(value.replace(/[^\d.]/g, ""));
  return Number.isFinite(number) ? number : 0;
}

/**
 * Pay any amount: type it, or tap a quick pick (finish this month, half a month, two months,
 * clear the loan). Underneath it says what that amount covers — e.g. "1½ months · ₦4,788 left
 * after this · ½ a month to go".
 */
export function RepayAmountField({
  terms,
  repaid,
  value,
  onChange,
  currency,
  disabled,
  label = "Amount",
}: {
  terms: LoanTerms;
  repaid: number;
  value: string;
  onChange: (value: string) => void;
  currency: string;
  disabled?: boolean;
  label?: string;
}) {
  const id = useId();
  const amount = parseAmount(value);
  const outstanding = Math.max(0, terms.totalRepayment - repaid);
  const covered = installmentsCovered(terms, repaid);

  const picks = useMemo(() => {
    const finish = amountToClear(terms, repaid, covered + 1);
    const partial =
      repaid -
        (covered > 0
          ? Math.min(terms.monthlyRepayment * covered, terms.totalRepayment)
          : 0) >
      0.005;
    const list: { label: string; amount: number }[] = [];
    const half = Math.round((terms.monthlyRepayment / 2) * 100) / 100;
    if (half > 0 && half < finish)
      list.push({ label: "Half a month", amount: half });
    list.push({
      label: partial ? "Finish this month" : "1 month",
      amount: finish,
    });
    const two = amountToClear(terms, repaid, covered + 2);
    if (two > finish && two < outstanding)
      list.push({
        label: partial ? "This + next month" : "2 months",
        amount: two,
      });
    if (outstanding > finish)
      list.push({ label: "Clear the loan", amount: outstanding });
    return list.filter((pick) => pick.amount > 0);
  }, [terms, repaid, covered, outstanding]);

  const coverage = coverageOf(terms, repaid, amount);

  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <span className="pointer-events-none absolute top-1/2 left-3 -translate-y-1/2 text-sm font-semibold text-muted-foreground">
          {currency === "NGN" ? "₦" : currency}
        </span>
        <Input
          id={id}
          inputMode="decimal"
          value={value}
          disabled={disabled}
          onChange={(event) => onChange(event.target.value)}
          placeholder="0.00"
          className="h-12 pl-9 text-lg font-semibold tabular-nums"
        />
      </div>
      <div className="flex flex-wrap gap-1.5">
        {picks.map((pick) => {
          const selected = Math.abs(pick.amount - amount) < 0.005;
          return (
            <button
              key={pick.label}
              type="button"
              disabled={disabled}
              onClick={() => onChange(pick.amount.toFixed(2))}
              className={cn(
                "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                selected
                  ? "border-primary bg-primary text-primary-foreground"
                  : "border-border text-foreground hover:border-primary/50 hover:bg-primary/5",
              )}
            >
              {pick.label}
              <span
                className={cn(
                  "ml-1 font-normal",
                  selected ? "opacity-80" : "text-muted-foreground",
                )}
              >
                {formatMoney(pick.amount, currency)}
              </span>
            </button>
          );
        })}
      </div>
      {amount > 0 ? (
        <motion.p
          key={coverage.tooMuch ? "too-much" : "ok"}
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          className={cn(
            "rounded-xl px-3.5 py-2.5 text-sm",
            coverage.tooMuch
              ? "bg-destructive/10 text-destructive"
              : coverage.clearsLoan
                ? "bg-success/10 text-success"
                : "bg-primary/5 text-foreground",
          )}
        >
          {coverage.tooMuch ? (
            <>
              Only {formatMoney(outstanding, currency)} is left to pay on this
              loan.
            </>
          ) : coverage.clearsLoan ? (
            <>This clears the loan. Nothing will be left to pay.</>
          ) : (
            <>
              Covers <b>{formatMonths(coverage.monthsCovered)}</b> ·{" "}
              {formatMoney(coverage.outstandingAfter, currency)} left after this
              · {formatMonths(coverage.monthsLeftAfter)} to go
            </>
          )}
        </motion.p>
      ) : null}
    </div>
  );
}

/** The top-of-page summary: months paid and left, money paid and left. */
export function LoanProgressCard({
  record,
  currency,
}: {
  record: LoanTerms & {
    amountRepaid?: number | null;
    repaymentsMade?: number;
    status: string;
    nextDueDate?: string | null;
    overdueAmount?: number;
  };
  currency: string;
}) {
  const progress = loanProgress(record);
  const done = record.status === "Completed" || progress.outstanding <= 0;

  const stats = [
    {
      icon: CalendarCheck,
      label: "Months paid",
      value: `${formatMonths(progress.monthsPaid)} of ${progress.monthsTotal}`,
    },
    {
      icon: CalendarCheck,
      label: "Months left",
      value: done ? "None" : formatMonths(progress.monthsLeft),
    },
    {
      icon: Wallet,
      label: "Paid so far",
      value: formatMoney(progress.repaid, currency),
    },
    {
      icon: Wallet,
      label: "Left to pay",
      value: formatMoney(progress.outstanding, currency),
    },
  ];

  return (
    <Card className="overflow-hidden">
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h3 className="flex items-center gap-2 text-sm font-semibold text-foreground">
            {done ? (
              <CircleCheck className="size-4 text-success" aria-hidden="true" />
            ) : null}
            {done ? "Fully repaid" : "Repayment progress"}
          </h3>
          <span className="text-xs text-muted-foreground">
            {done
              ? "Every installment is paid."
              : record.nextDueDate
                ? `Next due ${formatDateLong(new Date(record.nextDueDate))}`
                : null}
            {!done && record.overdueAmount && record.overdueAmount > 0 ? (
              <span className="ml-2 font-semibold text-destructive">
                {formatMoney(record.overdueAmount, currency)} overdue
              </span>
            ) : null}
          </span>
        </div>
        <div className="h-2.5 overflow-hidden rounded-full bg-muted">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(progress.share, 1) * 100}%` }}
            transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
            className={cn(
              "h-full rounded-full",
              done ? "bg-success" : "bg-primary",
            )}
          />
        </div>
        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
          {stats.map((stat) => (
            <div key={stat.label}>
              <dt className="text-xs text-muted-foreground">{stat.label}</dt>
              <dd className="mt-0.5 text-lg font-semibold text-foreground tabular-nums">
                {stat.value}
              </dd>
            </div>
          ))}
        </dl>
      </CardContent>
    </Card>
  );
}
