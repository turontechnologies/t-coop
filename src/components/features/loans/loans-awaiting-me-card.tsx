"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ChevronRight, ClipboardCheck } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { formatDateLong, formatMoney, getInitials } from "@/lib/format";

/** Loans waiting on the signed-in member's approval as a committee member. */
export function LoansAwaitingMeCard({
  loans,
  currency,
}: {
  loans: CoopLoanRecord[];
  currency: string;
}) {
  return (
    <Card className="border-amber-200 dark:border-amber-500/30">
      <CardContent className="space-y-4">
        <div className="flex items-center gap-3">
          <span className="flex size-10 items-center justify-center rounded-full bg-amber-100 text-amber-700 dark:bg-amber-500/15 dark:text-amber-300">
            <ClipboardCheck className="size-5" aria-hidden="true" />
          </span>
          <div>
            <h3 className="font-bold text-foreground">
              {loans.length === 1
                ? "A loan is waiting for your approval"
                : `${loans.length} loans are waiting for your approval`}
            </h3>
            <p className="text-sm text-muted-foreground">
              You&apos;re on the loan committee. Suggest an amount and repayment
              period, or reject with a reason.
            </p>
          </div>
        </div>
        <ul className="divide-y divide-border overflow-hidden rounded-2xl border border-border">
          {loans.map((loan, index) => (
            <motion.li
              key={loan.id}
              initial={{ opacity: 0, y: 4 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.25, delay: index * 0.03 }}
            >
              <Link
                href={`/loans/request/${loan.id}`}
                className="flex items-center gap-3 px-4 py-3 transition-colors hover:bg-muted/40"
              >
                <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-bold text-primary dark:text-emerald-300">
                  {getInitials(loan.memberName)}
                </span>
                <div className="min-w-0 flex-1">
                  <p className="truncate font-semibold text-foreground">
                    {loan.memberName} · {loan.loanType}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {formatMoney(loan.amount, currency)} over{" "}
                    {loan.durationMonths} months · applied{" "}
                    {formatDateLong(new Date(loan.date))}
                  </p>
                </div>
                <span className="hidden rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-semibold text-amber-800 sm:inline dark:bg-amber-500/15 dark:text-amber-300">
                  As {loan.approvalStepTitle ?? "approver"}
                </span>
                <ChevronRight
                  className="size-4 text-muted-foreground"
                  aria-hidden="true"
                />
              </Link>
            </motion.li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
