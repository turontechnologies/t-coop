"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanRepaymentPanel } from "@/components/features/loans/loan-repayment-panel";
import { coopLoanStatusBadgeVariant } from "@/lib/coop-data";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { cn } from "@/lib/utils";

interface CoopLoanRecordPageProps {
  params: Promise<{ id: string; recordId: string }>;
}

export default function CoopLoanRecordPage({
  params,
}: CoopLoanRecordPageProps) {
  const { id, recordId } = use(params);
  const router = useRouter();
  const coopQuery = useCooperative(id);
  const coop = coopQuery.data;
  const recordQuery = useCoopLoanRecord(recordId);
  const record = recordQuery.data;

  if (
    coopQuery.isError ||
    recordQuery.isError ||
    (!coopQuery.isLoading && !coop) ||
    (!recordQuery.isLoading && !record)
  ) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that loan record.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/co-operatives/${id}`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Co-operative
        </Button>
      </div>
    );
  }

  if (coopQuery.isLoading || recordQuery.isLoading || !coop || !record) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <CurrencyProvider currency={coop.currency}>
      <div className="space-y-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.back()}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        <Card>
          <CardHeader>
            <CardTitle>Loan Details</CardTitle>
          </CardHeader>
          <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
            <Field label="Loan Type" value={record.loanType} />
            <Field
              label="Loan Amount"
              value={formatMoney(record.amount, coop.currency)}
            />
            <Field
              label="Interest Rate"
              value={`${record.interestRate}% flat`}
            />
            <Field label="Duration" value={`${record.durationMonths} months`} />
            <Field
              label="Monthly Repayment"
              value={formatMoney(record.monthlyRepayment, coop.currency)}
            />
            <Field
              label="Total Repayment"
              value={formatMoney(record.totalRepayment, coop.currency)}
            />
            <Field
              label="Date Applied"
              value={formatDateLong(new Date(record.date))}
            />
            <Field
              label="Member"
              value={
                <Link
                  href={`/co-operatives/${coop.id}/members/${record.memberId}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {record.memberName}
                </Link>
              }
            />
            <Field label="Guarantor" value={record.guarantorName} />
            <div className="space-y-1">
              <p className="text-xs text-muted-foreground">Status</p>
              <Badge
                variant={coopLoanStatusBadgeVariant(record.status)}
                className={cn(
                  record.status === "Active" && "bg-success/15 text-success",
                  record.status === "Completed" && "bg-primary/10 text-primary",
                )}
              >
                {record.status}
              </Badge>
            </div>
            {record.rejectionReason ? (
              <Field
                label="Rejection Reason"
                value={record.rejectionReason}
                className="sm:col-span-2 lg:col-span-4"
              />
            ) : null}
          </CardContent>
        </Card>

        <LoanRepaymentPanel
          coopId={id}
          record={record}
          currency={coop.currency}
          canPay={false}
          canRecordManually
        />
      </div>
    </CurrencyProvider>
  );
}

function Field({
  label,
  value,
  className,
}: {
  label: string;
  value: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("space-y-1", className)}>
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
