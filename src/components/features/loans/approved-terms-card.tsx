"use client";

import { Banknote, CalendarClock, Check, ShieldCheck } from "lucide-react";

import { Card, CardContent } from "@/components/ui/card";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Statuses at which the committee has approved the loan. */
const APPROVED_STATUSES = new Set([
  "Awaiting Acceptance",
  "Pending Disbursement",
  "Active",
  "Completed",
]);

export function isApprovedLoan(record: CoopLoanRecord) {
  return APPROVED_STATUSES.has(record.status);
}

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

/**
 * The approved terms and the payout, in one place. Guarantors stand behind the loan, so they see
 * exactly what was approved and how much the borrower gets: "to be paid out" before the payout,
 * then what was paid, how and when.
 */
export function ApprovedTermsCard({
  record,
  viewer,
  netDisbursement,
  currency,
}: {
  record: CoopLoanRecord;
  viewer: "guarantor" | "borrower" | "staff";
  /** The approved amount less the loans charge (from the approvals endpoint). */
  netDisbursement: number | null | undefined;
  currency: string;
}) {
  const paidOut = record.disbursedAmount != null;
  const accepted = record.status !== "Awaiting Acceptance";
  const requested = record.requestedAmount ?? record.amount;
  const net = paidOut
    ? record.disbursedAmount!
    : (netDisbursement ?? record.amount);
  const charge = Math.max(0, record.amount - net);

  const title =
    viewer === "guarantor"
      ? "The loan you guaranteed"
      : viewer === "borrower"
        ? "Your approved loan"
        : "Approved terms";

  const statusLine = paidOut
    ? record.status === "Completed"
      ? "Paid out and fully repaid."
      : `Paid out${record.disbursedAt ? ` on ${formatDateLong(new Date(record.disbursedAt))}` : ""}. Repayments are under way.`
    : accepted
      ? `${viewer === "borrower" ? "You accepted" : `${record.memberName} accepted`} the offer. Waiting to be paid out.`
      : `Approved by the loan committee. Waiting for ${viewer === "borrower" ? "you" : record.memberName} to accept.`;

  const steps = [
    { label: "Approved", done: true },
    { label: "Accepted", done: accepted },
    { label: "Paid out", done: paidOut },
  ];

  return (
    <Card className="border-primary/20">
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
              <ShieldCheck className="size-5" aria-hidden="true" />
            </span>
            <div>
              <h2 className="font-semibold text-foreground">{title}</h2>
              <p className="text-sm text-muted-foreground">{statusLine}</p>
            </div>
          </div>
          <ol className="flex items-center gap-1.5" aria-label="Progress">
            {steps.map((step, index) => (
              <li key={step.label} className="flex items-center gap-1.5">
                <span
                  className={cn(
                    "inline-flex items-center gap-1 rounded-full px-2.5 py-1 text-xs font-medium",
                    step.done
                      ? "bg-success/10 text-success"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  {step.done ? (
                    <Check className="size-3" aria-hidden="true" />
                  ) : null}
                  {step.label}
                </span>
                {index < steps.length - 1 ? (
                  <span className="h-px w-3 bg-border" aria-hidden="true" />
                ) : null}
              </li>
            ))}
          </ol>
        </div>

        <dl className="grid grid-cols-1 gap-3 sm:grid-cols-3">
          <Figure
            label="Approved amount"
            value={formatMoney(record.amount, currency)}
            hint={
              requested !== record.amount
                ? `Requested ${formatMoney(requested, currency)}`
                : undefined
            }
          />
          <Figure
            icon={<CalendarClock className="size-4" aria-hidden="true" />}
            label="Repayment"
            value={`${formatMoney(record.monthlyRepayment, currency)} / month`}
            hint={`${plural(record.durationMonths, "month")} · ${formatMoney(record.totalRepayment, currency)} in total`}
          />
          <Figure
            highlight
            icon={<Banknote className="size-4" aria-hidden="true" />}
            label={paidOut ? "Paid out" : "To be paid out"}
            value={formatMoney(net, currency)}
            hint={
              paidOut
                ? [
                    record.disbursementMethod === "Cheque"
                      ? `Cheque${record.chequeNumber ? ` No. ${record.chequeNumber}` : ""}`
                      : "Online transfer",
                    record.disbursedAt
                      ? formatDateLong(new Date(record.disbursedAt))
                      : null,
                  ]
                    .filter(Boolean)
                    .join(" · ")
                : charge > 0
                  ? `After the ${formatMoney(charge, currency)} loans charge`
                  : "The full approved amount"
            }
          />
        </dl>
      </CardContent>
    </Card>
  );
}

function Figure({
  label,
  value,
  hint,
  icon,
  highlight,
}: {
  label: string;
  value: string;
  hint?: string;
  icon?: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div
      className={cn(
        "rounded-xl border px-4 py-3",
        highlight ? "border-primary/30 bg-primary/5" : "border-border",
      )}
    >
      <dt className="flex items-center gap-1.5 text-xs text-muted-foreground">
        {icon}
        {label}
      </dt>
      <dd className="mt-1 text-lg font-semibold text-foreground tabular-nums">
        {value}
      </dd>
      {hint ? <dd className="text-xs text-muted-foreground">{hint}</dd> : null}
    </div>
  );
}
