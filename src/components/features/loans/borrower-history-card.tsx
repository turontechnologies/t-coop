"use client";

import { AlertTriangle, CheckCircle2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useLoanHistory } from "@/hooks/use-loans-self";
import { formatDateLong, formatMoney } from "@/lib/format";
import { loanModeLabel } from "@/lib/loans-data";
import { cn } from "@/lib/utils";

/**
 * Everything an officer needs before approving a loan: does this member already owe money, how
 * reliably have they repaid, and every loan they've had with its repayments. Renders nothing for
 * someone who can't see it (the endpoint answers 403 to non-staff).
 */
export function BorrowerHistoryCard({
  coopId,
  memberId,
  currency,
  excludeLoanId,
}: {
  coopId: string | undefined;
  memberId: string;
  currency: string;
  /** The loan being reviewed — left out of "other loans" so it isn't counted against itself. */
  excludeLoanId?: string;
}) {
  const {
    data: history,
    isLoading,
    isError,
  } = useLoanHistory(coopId, memberId);

  if (isError) return null;
  if (isLoading || !history) {
    return <div className="h-40 animate-pulse rounded-xl bg-muted" />;
  }

  const { summary } = history;
  const otherLoans = history.loans.filter((loan) => loan.id !== excludeLoanId);
  const money = (value: number) => formatMoney(value, currency);
  const owes = summary.outstandingBalance > 0;
  const overdue = summary.overdueInstallments > 0;

  return (
    <Card>
      <CardHeader>
        <CardTitle>Borrower history — {history.memberName}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div
          className={cn(
            "flex items-start gap-2 rounded-lg border px-3 py-2.5 text-sm",
            overdue
              ? "border-destructive/40 bg-destructive/10 text-destructive"
              : owes
                ? "border-amber-500/40 bg-amber-500/10 text-amber-700 dark:text-amber-400"
                : "border-border bg-muted/40 text-muted-foreground",
          )}
        >
          {owes || overdue ? (
            <AlertTriangle
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          ) : (
            <CheckCircle2
              className="mt-0.5 size-4 shrink-0"
              aria-hidden="true"
            />
          )}
          <span>
            {overdue
              ? `${summary.overdueInstallments} installment${summary.overdueInstallments === 1 ? " is" : "s are"} overdue — ${money(summary.outstandingBalance)} still owed across ${summary.activeLoans} active loan${summary.activeLoans === 1 ? "" : "s"}.`
              : owes
                ? `Has ${summary.activeLoans} active loan${summary.activeLoans === 1 ? "" : "s"} with ${money(summary.outstandingBalance)} still owed (up to date).`
                : "No outstanding loans."}
          </span>
        </div>

        <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-3 lg:grid-cols-6">
          <Stat label="Savings" value={money(history.totalSavings)} />
          <Stat label="Outstanding" value={money(summary.outstandingBalance)} />
          <Stat label="Active loans" value={String(summary.activeLoans)} />
          <Stat
            label="Repaid on time"
            value={
              summary.onTimeRate === null
                ? "No repayments yet"
                : `${summary.onTimeRate}% (${summary.onTimeRepayments} of ${summary.repaymentsMade})`
            }
          />
          <Stat
            label="Late repayments"
            value={String(summary.lateRepayments)}
          />
          <Stat
            label="Last repayment"
            value={
              summary.lastRepaymentDate
                ? formatDateLong(new Date(summary.lastRepaymentDate))
                : "—"
            }
          />
          <Stat label="Total borrowed" value={money(summary.totalBorrowed)} />
          <Stat label="Total repaid" value={money(summary.totalRepaid)} />
          <Stat
            label="Completed / rejected"
            value={`${summary.completedLoans} / ${summary.rejectedLoans}`}
          />
        </dl>

        <div className="space-y-2">
          <p className="text-sm font-medium text-foreground">
            Loan history ({otherLoans.length})
          </p>
          {otherLoans.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No other loans on record.
            </p>
          ) : (
            <ul className="divide-y divide-border rounded-lg border border-border">
              {otherLoans.map((loan) => (
                <li key={loan.id}>
                  <details className="group">
                    <summary className="flex cursor-pointer list-none flex-wrap items-center justify-between gap-2 px-3 py-2.5 text-sm">
                      <span className="flex flex-wrap items-center gap-2">
                        <span className="font-medium text-foreground">
                          {loan.loanType}
                        </span>
                        <Badge variant="outline">
                          {loanModeLabel(loan.loanMode)}
                        </Badge>
                        <Badge
                          variant={
                            loan.status === "Rejected"
                              ? "destructive"
                              : loan.status === "Active" ||
                                  loan.status === "Completed"
                                ? "secondary"
                                : "outline"
                          }
                        >
                          {loan.status}
                        </Badge>
                        {loan.overdueInstallments > 0 ? (
                          <Badge variant="destructive">
                            {loan.overdueInstallments} overdue
                          </Badge>
                        ) : null}
                      </span>
                      <span className="text-muted-foreground">
                        {money(loan.amount)} · repaid {money(loan.repaid)}
                        {loan.outstanding > 0
                          ? ` · owes ${money(loan.outstanding)}`
                          : ""}{" "}
                        · {loan.repaymentsMade}/{loan.numberOfRepayments}{" "}
                        installments
                      </span>
                    </summary>
                    <div className="space-y-2 px-3 pb-3 text-xs text-muted-foreground">
                      <p>
                        Applied {formatDateLong(new Date(loan.appliedOn))}
                        {loan.paidOutOn
                          ? ` · paid out ${formatDateLong(new Date(loan.paidOutOn))}`
                          : ""}
                        {loan.nextDueDate
                          ? ` · next due ${formatDateLong(new Date(loan.nextDueDate))}`
                          : ""}
                      </p>
                      {loan.repayments.length === 0 ? (
                        <p>No repayments yet.</p>
                      ) : (
                        <table className="w-full text-left">
                          <thead>
                            <tr className="text-foreground">
                              <th className="py-1 font-medium">#</th>
                              <th className="py-1 font-medium">Amount</th>
                              <th className="py-1 font-medium">Due</th>
                              <th className="py-1 font-medium">Paid</th>
                              <th className="py-1 font-medium">Timing</th>
                            </tr>
                          </thead>
                          <tbody>
                            {loan.repayments.map((repayment) => (
                              <tr key={repayment.installmentNumber}>
                                <td className="py-1">
                                  {repayment.installmentNumber}
                                </td>
                                <td className="py-1">
                                  {money(repayment.amount)}
                                </td>
                                <td className="py-1">
                                  {formatDateLong(new Date(repayment.dueDate))}
                                </td>
                                <td className="py-1">
                                  {formatDateLong(new Date(repayment.paidOn))}
                                </td>
                                <td
                                  className={cn(
                                    "py-1",
                                    repayment.daysLate > 0 &&
                                      "text-destructive",
                                  )}
                                >
                                  {repayment.daysLate > 0
                                    ? `${repayment.daysLate} day${repayment.daysLate === 1 ? "" : "s"} late`
                                    : "On time"}
                                </td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd className="text-sm font-semibold text-foreground">{value}</dd>
    </div>
  );
}
