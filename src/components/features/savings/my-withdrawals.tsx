"use client";

import { CheckCircle2, Clock, Receipt, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { useWithdrawalRequests } from "@/hooks/use-savings-self";
import type { SavingsRequest } from "@/lib/coop-data";
import { formatDateLong, formatMoney, formatTimeAgo } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { cn } from "@/lib/utils";

const PAID_BY: Record<string, string> = {
  Online: "Sent to your bank account",
  Transfer: "Paid by bank transfer",
  Cheque: "Paid by cheque",
  Cash: "Paid in cash",
};

const EXPORT_COLUMNS: ExportColumn<SavingsRequest>[] = [
  { header: "Requested", accessor: (r) => r.requestedAt.slice(0, 10) },
  { header: "Savings Type", accessor: (r) => r.savingsType },
  { header: "Amount", accessor: (r) => r.amount },
  { header: "You Receive", accessor: (r) => r.netAmount ?? r.amount },
  { header: "Status", accessor: (r) => r.status },
  {
    header: "How It Was Paid",
    accessor: (r) => (r.payoutMethod ? PAID_BY[r.payoutMethod] : ""),
  },
  { header: "Reason", accessor: (r) => r.declineReason ?? "" },
];

/** A member's own withdrawal requests: waiting, approved (and how it was paid) or declined (and why). */
export function MyWithdrawalsCard({
  coopId,
  memberId,
  currency,
}: {
  coopId: string;
  memberId: string;
  currency: string;
}) {
  const { data: requests = [], isLoading } = useWithdrawalRequests(
    coopId,
    memberId,
  );
  const withdrawals = requests.filter(
    (request) => request.type === "Withdrawal",
  );

  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              My withdrawals
            </h3>
            <p className="text-xs text-muted-foreground">
              Every withdrawal you asked for, and what happened to it.
            </p>
          </div>
          <ExportImportMenu
            rows={withdrawals}
            columns={EXPORT_COLUMNS}
            filenamePrefix={`withdrawals-${memberId}`}
            exportTitle="My withdrawals"
            entityLabel="withdrawal"
          />
        </div>
        {isLoading ? (
          <div className="h-24 animate-pulse rounded-xl bg-muted" />
        ) : withdrawals.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            You haven&apos;t asked for a withdrawal yet.
          </p>
        ) : (
          <ul className="space-y-2">
            {withdrawals.map((request) => {
              const Icon =
                request.status === "Approved"
                  ? CheckCircle2
                  : request.status === "Declined"
                    ? XCircle
                    : Clock;
              return (
                <li
                  key={request.id}
                  className="flex flex-wrap items-start gap-3 rounded-xl border border-border px-4 py-3"
                >
                  <span
                    className={cn(
                      "flex size-9 shrink-0 items-center justify-center rounded-full",
                      request.status === "Approved" &&
                        "bg-success/15 text-success",
                      request.status === "Declined" &&
                        "bg-destructive/15 text-destructive",
                      request.status === "Pending" &&
                        "bg-amber-500/15 text-amber-600 dark:text-amber-300",
                    )}
                  >
                    <Icon className="size-4" aria-hidden="true" />
                  </span>
                  <div className="min-w-0 flex-1 space-y-0.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatMoney(request.amount, currency)}
                      </span>
                      <Badge
                        variant={
                          request.status === "Approved"
                            ? "secondary"
                            : request.status === "Declined"
                              ? "destructive"
                              : "outline"
                        }
                        className={cn(
                          request.status === "Approved" &&
                            "bg-success/15 text-success",
                        )}
                      >
                        {request.status === "Pending"
                          ? "Waiting for approval"
                          : request.status}
                      </Badge>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      {request.savingsType} · asked{" "}
                      {formatTimeAgo(request.requestedAt)}
                      {request.netAmount != null &&
                      request.netAmount !== request.amount
                        ? ` · you receive ${formatMoney(request.netAmount, currency)} after the fee`
                        : ""}
                    </p>
                    {request.status === "Approved" ? (
                      <p className="text-xs text-success">
                        {request.payoutMethod
                          ? PAID_BY[request.payoutMethod]
                          : "Approved"}
                        {request.resolvedAt
                          ? ` on ${formatDateLong(new Date(request.resolvedAt))}`
                          : ""}
                        {request.payoutReference
                          ? ` · Ref ${request.payoutReference}`
                          : ""}
                      </p>
                    ) : null}
                    {request.status === "Declined" ? (
                      <p className="text-xs text-destructive">
                        {request.declineReason
                          ? `Reason: ${request.declineReason}`
                          : "No reason was given."}
                      </p>
                    ) : null}
                    {request.payoutReceiptUrl ? (
                      <a
                        href={request.payoutReceiptUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
                      >
                        <Receipt className="size-3.5" aria-hidden="true" />
                        View receipt
                      </a>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
