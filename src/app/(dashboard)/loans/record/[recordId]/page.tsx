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
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCooperative } from "@/hooks/use-cooperative";
import { formatDateLong, formatMoney } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface AdminLoanRecordPageProps {
  params: Promise<{ recordId: string }>;
}

export default function AdminLoanRecordPage({
  params,
}: AdminLoanRecordPageProps) {
  const { recordId } = use(params);
  const router = useRouter();
  const authMember = useAuthStore((state) => state.member);
  const coopId =
    authMember?.role === "admin"
      ? authMember.id
      : (authMember?.cooperativeId ?? undefined);
  const { data: coop } = useCooperative(coopId);
  const { data: record, isLoading } = useCoopLoanRecord(recordId);
  const { data: members = [] } = useCoopMembers(coopId);
  const member = members.find((item) => item.id === record?.memberId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!coop || !record) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that loan record.
        </p>
        <Button variant="outline" onClick={() => router.push("/loans")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Loans
        </Button>
      </div>
    );
  }

  return (
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
          <Field label="Interest Rate" value={`${record.interestRate}% flat`} />
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
              member ? (
                <Link
                  href={`/members/${member.id}`}
                  className="font-semibold text-primary underline-offset-4 hover:underline"
                >
                  {record.memberName}
                </Link>
              ) : (
                record.memberName
              )
            }
          />
          <Field label="Guarantor" value={record.guarantorName} />
          <div className="space-y-1">
            <p className="text-xs text-muted-foreground">Status</p>
            <Badge variant={coopLoanStatusBadgeVariant(record.status)}>
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
        coopId={coopId ?? ""}
        record={record}
        currency={coop.currency}
        canPay={false}
        canRecordManually
      />
    </div>
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
