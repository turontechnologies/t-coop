"use client";

import { use, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { LoanRepaymentPanel } from "@/components/features/loans/loan-repayment-panel";
import type { CoopLoanStatus } from "@/lib/coop-data";
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { useGuarantorResponse, useLoanDecision } from "@/hooks/use-loans-self";
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

  const coopId =
    member?.role === "admin" ? member.id : (member?.cooperativeId ?? "");
  const guarantorResponse = useGuarantorResponse(coopId);
  const loanDecision = useLoanDecision(coopId);
  const [rejectReason, setRejectReason] = useState("");

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

  const isBorrower = record.memberId === member.id;
  const isGuarantor = record.guarantorId === member.id;
  const isAdmin = member.role === "admin";
  const showGuarantorActions =
    record.status === "Awaiting Guarantor" && isGuarantor;
  const showAdminActions = record.status === "Awaiting Admin" && isAdmin;

  const handleGuarantorAccept = async () => {
    try {
      await guarantorResponse.mutateAsync({
        loanId: record.id,
        decision: "Accepted",
      });
      toast.success("You've accepted this guarantor request");
    } catch (error) {
      toast.error("Couldn't record your response", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleGuarantorReject = async () => {
    try {
      await guarantorResponse.mutateAsync({
        loanId: record.id,
        decision: "Rejected",
      });
      toast.success("You've declined this guarantor request");
    } catch (error) {
      toast.error("Couldn't record your response", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleReject = async () => {
    try {
      await loanDecision.mutateAsync({
        loanId: record.id,
        decision: "Rejected",
        rejectionReason: rejectReason.trim(),
      });
      setRejectReason("");
      toast.success("Loan application rejected");
    } catch (error) {
      toast.error("Couldn't reject that loan", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

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
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
          <CardTitle>Loan Details</CardTitle>
          {showGuarantorActions ? (
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="outline" />}>
                  Reject Request
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Reject guarantor request
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;ll be recorded as declining to guarantee{" "}
                      {record.memberName}&apos;s {record.loanType}. The loan is
                      marked Rejected — no admin decision needed afterward.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={guarantorResponse.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={guarantorResponse.isPending}
                      onClick={handleGuarantorReject}
                    >
                      {guarantorResponse.isPending ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        "Reject"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <AlertDialog>
                <AlertDialogTrigger render={<Button />}>
                  Accept Request
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>
                      Accept guarantor request?
                    </AlertDialogTitle>
                    <AlertDialogDescription>
                      You&apos;re agreeing to stand as guarantor for{" "}
                      {record.memberName}, for a {record.loanType} of{" "}
                      {formatMoney(record.amount, currency)}.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel disabled={guarantorResponse.isPending}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      disabled={guarantorResponse.isPending}
                      onClick={handleGuarantorAccept}
                    >
                      {guarantorResponse.isPending ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        "Accept"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </div>
          ) : showAdminActions ? (
            <div className="flex items-center gap-2">
              <AlertDialog>
                <AlertDialogTrigger render={<Button variant="outline" />}>
                  Reject
                </AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Reject loan application</AlertDialogTitle>
                    <AlertDialogDescription>
                      {record.memberName} will see the reason you give below.
                    </AlertDialogDescription>
                  </AlertDialogHeader>
                  <div className="space-y-2">
                    <Label>Reason for rejection</Label>
                    <Textarea
                      placeholder="e.g. Insufficient savings history for this loan type."
                      value={rejectReason}
                      onChange={(event) => setRejectReason(event.target.value)}
                    />
                  </div>
                  <AlertDialogFooter>
                    <AlertDialogCancel onClick={() => setRejectReason("")}>
                      Cancel
                    </AlertDialogCancel>
                    <AlertDialogAction
                      variant="destructive"
                      disabled={!rejectReason.trim() || loanDecision.isPending}
                      onClick={handleReject}
                    >
                      {loanDecision.isPending ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : (
                        "Reject"
                      )}
                    </AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
              <Button
                nativeButton={false}
                render={<Link href={`/loans/request/${record.id}`} />}
              >
                Review to Approve
              </Button>
            </div>
          ) : null}
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
          {record.rejectionReason ? (
            <Field
              label="Rejection Reason"
              value={record.rejectionReason}
              className="sm:col-span-2 lg:col-span-4"
            />
          ) : null}
        </CardContent>
      </Card>

      {record.status === "Active" ? (
        <LoanRepaymentPanel
          coopId={coopId}
          record={record}
          currency={currency}
          canPay={isBorrower}
          canRecordManually={isAdmin && !isBorrower}
          memberEmail={member.email}
        />
      ) : null}
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
