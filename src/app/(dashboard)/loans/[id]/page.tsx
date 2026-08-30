"use client";

import { use, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LoanRepaymentPanel } from "@/components/features/loans/loan-repayment-panel";
import type { CoopLoanStatus } from "@/lib/coop-data";
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface LoanDetailsPageProps {
  params: Promise<{ id: string }>;
}

function statusBadgeVariant(status: CoopLoanStatus) {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Awaiting Guarantor" || status === "Awaiting Admin")
    return "outline";
  return "destructive";
}

export default function LoanDetailsPage({ params }: LoanDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const { data: record, isLoading } = useCoopLoanRecord(id);
  const currency = useCurrency();

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!record || !member) {
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

  const coopId =
    member.role === "admin" ? member.id : (member.cooperativeId ?? "");

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/loans")}
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
            value={formatMoney(record.amount, currency)}
          />
          <Field label="Interest Rate" value={`${record.interestRate}% flat`} />
          <Field label="Duration" value={`${record.durationMonths} months`} />
          <Field
            label="Monthly Repayment"
            value={formatMoney(record.monthlyRepayment, currency)}
          />
          <Field
            label="Total Repayment"
            value={formatMoney(record.totalRepayment, currency)}
          />
          <Field
            label="Date Applied"
            value={formatDateLong(new Date(record.date))}
          />
          <Field
            label="Member"
            value={
              <Link
                href="/profile"
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
              variant={statusBadgeVariant(record.status)}
              className={cn(
                record.status === "Active" && "bg-success/15 text-success",
                record.status === "Completed" && "bg-primary/10 text-primary",
              )}
            >
              {record.status}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <LoanRepaymentPanel
        coopId={coopId}
        record={record}
        currency={currency}
        canPay
        canRecordManually={false}
        memberEmail={member.email}
      />
    </div>
  );
}

function Field({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
