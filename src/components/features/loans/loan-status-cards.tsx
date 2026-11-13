"use client";

import { motion } from "framer-motion";
import { AlertTriangle, Clock, Landmark, Wallet } from "lucide-react";
import { PENDING_LOAN_STATUSES, type CoopLoanRecord } from "@/lib/coop-data";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

/** Which slice of loans a card stands for, and the list filter it applies. */
export type LoanSlice = "owed" | "repaid" | "progress" | "overdue";

const EASE = [0.16, 1, 0.3, 1] as const;

const round = (n: number) => Math.round(n * 100) / 100;
const plural = (n: number, one: string, many = `${one}s`) =>
  `${n} ${n === 1 ? one : many}`;

/** The loans a card stands for — the same rule the cards count by. */
export function loansInSlice(
  records: CoopLoanRecord[],
  slice: LoanSlice,
): CoopLoanRecord[] {
  switch (slice) {
    case "owed":
      return records.filter((r) => r.status === "Active");
    case "repaid":
      return records.filter((r) => (r.amountRepaid ?? 0) > 0);
    case "progress":
      return records.filter((r) => PENDING_LOAN_STATUSES.includes(r.status));
    case "overdue":
      return records.filter((r) => (r.overdueInstallments ?? 0) > 0);
  }
}

export const LOAN_SLICE_LABELS: Record<LoanSlice, string> = {
  owed: "Still owed",
  repaid: "Repaid",
  progress: "In progress",
  overdue: "Overdue",
};

/**
 * Still owed · Repaid · In progress · Overdue — the same definitions the dashboard uses ("Still
 * owed" is its Loans figure). Click a card to filter the list below to those loans; click it
 * again to clear.
 */
export function LoanStatusCards({
  records,
  currency,
  scope,
  active,
  onSelect,
}: {
  records: CoopLoanRecord[];
  currency: string;
  /** "coop" counts members too (for overdue); "member" words things for the borrower. */
  scope: "coop" | "member";
  active: LoanSlice | null;
  onSelect: (slice: LoanSlice | null) => void;
}) {
  const running = loansInSlice(records, "owed");
  const owed = round(
    running.reduce((s, r) => s + (r.outstandingBalance ?? 0), 0),
  );
  const repaid = round(records.reduce((s, r) => s + (r.amountRepaid ?? 0), 0));
  const completed = records.filter((r) => r.status === "Completed").length;
  const inProgress = loansInSlice(records, "progress");
  const progressAmount = round(inProgress.reduce((s, r) => s + r.amount, 0));
  const approval = inProgress.filter(
    (r) =>
      r.status === "Awaiting Guarantor" || r.status === "Awaiting Approval",
  ).length;
  const borrower = inProgress.filter(
    (r) => r.status === "Awaiting Acceptance",
  ).length;
  const ready = inProgress.filter(
    (r) => r.status === "Pending Disbursement",
  ).length;
  const overdueLoans = loansInSlice(records, "overdue");
  const overdueAmount = round(
    overdueLoans.reduce((s, r) => s + (r.overdueAmount ?? 0), 0),
  );
  const overdueRepayments = overdueLoans.reduce(
    (s, r) => s + (r.overdueInstallments ?? 0),
    0,
  );
  const overdueMembers = new Set(overdueLoans.map((r) => r.memberId)).size;

  const progressParts = [
    approval ? `${approval} awaiting approval` : null,
    borrower
      ? scope === "member"
        ? `${borrower} awaiting your answer`
        : `${borrower} awaiting borrower`
      : null,
    ready ? `${ready} ready to pay out` : null,
  ].filter(Boolean);

  const cards: {
    slice: LoanSlice;
    value: string;
    sub: string;
    icon: typeof Landmark;
    tone: string;
  }[] = [
    {
      slice: "owed",
      value: formatMoney(owed, currency),
      sub: `On ${plural(running.length, "running loan")}`,
      icon: Landmark,
      tone: "bg-primary/10 text-primary dark:text-emerald-300",
    },
    {
      slice: "repaid",
      value: formatMoney(repaid, currency),
      sub: completed
        ? `${plural(completed, "loan")} fully repaid`
        : "Repayments so far",
      icon: Wallet,
      tone: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-300",
    },
    {
      slice: "progress",
      value: formatMoney(progressAmount, currency),
      sub: progressParts.length ? progressParts.join(" · ") : "Nothing waiting",
      icon: Clock,
      tone: "bg-amber-500/10 text-amber-700 dark:text-amber-300",
    },
    {
      slice: "overdue",
      value: formatMoney(overdueAmount, currency),
      sub: overdueRepayments
        ? scope === "coop"
          ? `${plural(overdueRepayments, "repayment")} · ${plural(overdueMembers, "member")}`
          : `${plural(overdueRepayments, "repayment")} past due`
        : "All repayments on time",
      icon: AlertTriangle,
      tone: overdueRepayments
        ? "bg-rose-500/10 text-rose-700 dark:text-rose-300"
        : "bg-muted text-muted-foreground",
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
      {cards.map((card, index) => {
        const selected = active === card.slice;
        return (
          <motion.button
            key={card.slice}
            type="button"
            aria-pressed={selected}
            onClick={() => onSelect(selected ? null : card.slice)}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: index * 0.04, ease: EASE }}
            className={cn(
              "flex items-start justify-between gap-3 rounded-2xl border bg-card p-5 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised",
              selected
                ? "border-primary/60 ring-4 ring-primary/10"
                : "border-border",
            )}
          >
            <div className="min-w-0 space-y-1">
              <p className="text-sm font-medium text-muted-foreground">
                {LOAN_SLICE_LABELS[card.slice]}
              </p>
              <p className="text-2xl font-bold tracking-tight text-foreground tabular-nums">
                {card.value}
              </p>
              <p className="text-sm text-muted-foreground">{card.sub}</p>
            </div>
            <span
              className={cn(
                "flex size-11 shrink-0 items-center justify-center rounded-full",
                card.tone,
              )}
            >
              <card.icon className="size-5" aria-hidden="true" />
            </span>
          </motion.button>
        );
      })}
    </div>
  );
}
