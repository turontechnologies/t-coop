"use client";

import { use, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowLeft,
  CheckCircle2,
  Circle,
  CircleDot,
  Loader2,
  Paperclip,
  XCircle,
} from "lucide-react";
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
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  coopLoanStatusBadgeVariant,
  coopMemberFullName,
  type CoopLoanRecord,
  type CoopMember,
} from "@/lib/coop-data";
import { MAX_ATTACHMENT_BYTES } from "@/lib/file-to-data-url";
import { formatDateLong, formatMoney, getInitials } from "@/lib/format";
import { useCoopLoanRecord } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCooperative } from "@/hooks/use-cooperative";
import {
  useGuarantorResponse,
  useLoanApprovals,
  useLoanDecision,
} from "@/hooks/use-loans-self";
import type { LoanApprovalStatus } from "@/services/loan-self.service";
import { uploadService } from "@/services/upload.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { loanModeLabel } from "@/lib/loans-data";
import { BorrowerHistoryCard } from "@/components/features/loans/borrower-history-card";

interface LoanRequestPageProps {
  params: Promise<{ recordId: string }>;
}

export default function LoanRequestPage({ params }: LoanRequestPageProps) {
  const { recordId } = use(params);
  const router = useRouter();
  const authMember = useAuthStore((state) => state.member);
  const coopId =
    authMember?.role === "admin"
      ? authMember.id
      : (authMember?.cooperativeId ?? undefined);

  const { data: record, isLoading } = useCoopLoanRecord(recordId);
  const { data: coop } = useCooperative(coopId);
  const { data: members = [] } = useCoopMembers(coopId);
  const guarantorResponse = useGuarantorResponse(coopId ?? "");
  const loanDecision = useLoanDecision(coopId ?? "");
  const { data: approvals } = useLoanApprovals(coopId, recordId);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!coop || !record) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that loan request.
        </p>
        <Button variant="outline" onClick={() => router.push("/loans")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Loans
        </Button>
      </div>
    );
  }

  const guarantorMember = members.find(
    (m) => coopMemberFullName(m) === record.guarantorName,
  );

  const handleGuarantorAccept = async (documentUrl?: string) => {
    try {
      await guarantorResponse.mutateAsync({
        loanId: record.id,
        decision: "Accepted",
        documentUrl,
      });
      toast.success("Guarantor accepted", {
        description: `${record.guarantorName} has agreed to guarantee this loan — now awaiting the admin's decision.`,
      });
    } catch (error) {
      toast.error("Couldn't accept", {
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
      toast.success("Guarantor request declined", {
        description: `Recorded as declined for ${record.memberName}'s loan.`,
      });
    } catch (error) {
      toast.error("Couldn't decline", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const finalStep = approvals?.currentStep === "SECRETARY";

  const handleApprove = async () => {
    try {
      const updated = await loanDecision.mutateAsync({
        loanId: record.id,
        decision: "Approved",
      });
      if (updated.status === "Active") {
        toast.success("Loan approved and paid out", {
          description: `${formatMoney(updated.disbursedAmount ?? record.amount, coop.currency)} sent to ${record.memberName}'s bank account.`,
        });
      } else {
        toast.success("Loan approved", {
          description: `Now ${updated.status.toLowerCase()}.`,
        });
      }
    } catch (error) {
      toast.error(finalStep ? "Payout failed" : "Couldn't approve", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleReject = async (reason: string) => {
    try {
      await loanDecision.mutateAsync({
        loanId: record.id,
        decision: "Rejected",
        rejectionReason: reason,
      });
      toast.success("Loan rejected", {
        description: `${record.memberName} will see this reason: "${reason}"`,
      });
    } catch (error) {
      toast.error("Couldn't reject", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const showGuarantorCard = record.status === "Awaiting Guarantor";
  // Only the named guarantor can accept or decline — the backend enforces it too.
  const showGuarantorActions =
    showGuarantorCard && authMember?.id === record.guarantorId;
  const canApprove = !!approvals?.canApprove;
  const canReject = !!approvals?.canReject;

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

      <div
        className={cn(
          "grid grid-cols-1 gap-4",
          showGuarantorCard && "lg:grid-cols-3",
        )}
      >
        {showGuarantorCard ? (
          <div className="lg:col-span-1">
            <GuarantorProfileCard
              name={record.guarantorName ?? ""}
              member={guarantorMember}
            />
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-4",
            showGuarantorCard ? "lg:col-span-2" : undefined,
          )}
        >
          <Card>
            <CardHeader className="flex-row flex-wrap items-center justify-between gap-3 space-y-0">
              <CardTitle>Loan Details</CardTitle>
              {showGuarantorActions ? (
                <div className="flex items-center gap-2">
                  <RejectGuarantorDialog
                    record={record}
                    onConfirm={handleGuarantorReject}
                  />
                  <AcceptGuarantorDialog
                    record={record}
                    currency={coop.currency}
                    onConfirm={handleGuarantorAccept}
                  />
                </div>
              ) : canApprove || canReject ? (
                <div className="flex flex-wrap items-center gap-2">
                  {approvals?.actingAs ? (
                    <span className="text-xs text-muted-foreground">
                      Acting as {approvals.actingAs}
                    </span>
                  ) : null}
                  {canReject ? (
                    <RejectLoanDialog
                      record={record}
                      onConfirm={handleReject}
                    />
                  ) : null}
                  {canApprove ? (
                    <ApproveLoanDialog
                      record={record}
                      currency={coop.currency}
                      finalStep={finalStep}
                      netAmount={approvals?.netDisbursement ?? null}
                      nextStepLabel={nextStepLabel(approvals)}
                      onConfirm={handleApprove}
                    />
                  ) : null}
                </div>
              ) : null}
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
              <Field
                label="Duration"
                value={`${record.durationMonths} months`}
              />
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
                    href={`/members/${record.memberId}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {record.memberName}
                  </Link>
                }
              />
              <Field label="Loan Mode" value={loanModeLabel(record.loanMode)} />
              <Field
                label="Guarantor"
                value={record.guarantorName ?? "None (Within loan)"}
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={coopLoanStatusBadgeVariant(record.status)}>
                  {record.status}
                </Badge>
              </div>
              {record.disbursedAmount != null ? (
                <Field
                  label="Paid Out"
                  value={`${formatMoney(record.disbursedAmount, coop.currency)}${
                    record.disbursedAt
                      ? ` on ${formatDateLong(new Date(record.disbursedAt))}`
                      : ""
                  }`}
                />
              ) : null}
              {record.rejectionReason ? (
                <Field
                  label="Rejection Reason"
                  value={record.rejectionReason}
                  className="sm:col-span-2 lg:col-span-4"
                />
              ) : null}
            </CardContent>
          </Card>

          {approvals ? (
            <ApprovalTimeline approvals={approvals} status={record.status} />
          ) : null}

          <BorrowerHistoryCard
            coopId={coopId}
            memberId={record.memberId}
            currency={coop.currency}
            excludeLoanId={record.id}
          />
        </div>
      </div>
    </div>
  );
}

/** The step after the current one, for the approve dialog's "passes to …" copy. */
function nextStepLabel(approvals: LoanApprovalStatus | undefined) {
  if (!approvals?.currentStep) return null;
  const index = approvals.chain.findIndex(
    (step) => step.office === approvals.currentStep,
  );
  return approvals.chain[index + 1]?.label ?? null;
}

/** Vice President -> Treasurer -> Secretary, with who holds each office and what each decided. */
function ApprovalTimeline({
  approvals,
  status,
}: {
  approvals: LoanApprovalStatus;
  status: CoopLoanRecord["status"];
}) {
  const rejection = approvals.trail.find((d) => d.decision === "Rejected");
  return (
    <Card>
      <CardHeader>
        <CardTitle>Approvals</CardTitle>
      </CardHeader>
      <CardContent>
        <ol className="space-y-4">
          {approvals.chain.map((step) => {
            const decision = approvals.trail.find(
              (d) => d.office === step.office,
            );
            const isCurrent = approvals.currentStep === step.office;
            return (
              <li key={step.office} className="flex gap-3">
                {decision?.decision === "Approved" ? (
                  <CheckCircle2
                    className="mt-0.5 size-4 shrink-0 text-emerald-600"
                    aria-hidden="true"
                  />
                ) : decision?.decision === "Rejected" ? (
                  <XCircle
                    className="mt-0.5 size-4 shrink-0 text-destructive"
                    aria-hidden="true"
                  />
                ) : isCurrent ? (
                  <CircleDot
                    className="mt-0.5 size-4 shrink-0 text-primary"
                    aria-hidden="true"
                  />
                ) : (
                  <Circle
                    className="mt-0.5 size-4 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                )}
                <div className="min-w-0 space-y-0.5">
                  <p className="text-sm font-medium text-foreground">
                    {step.label}
                    {step.office === "SECRETARY" ? (
                      <span className="font-normal text-muted-foreground">
                        {" "}
                        · approval pays the loan out
                      </span>
                    ) : null}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {decision
                      ? `${decision.decision} by ${decision.memberName}${
                          decision.covering ? " (admin, covering)" : ""
                        } · ${formatDateLong(new Date(decision.actedAt))}`
                      : isCurrent
                        ? step.holderName
                          ? `Waiting for ${step.holderName}`
                          : "Office vacant — the co-op admin can approve this step"
                        : step.holderName
                          ? step.holderName
                          : "Office vacant — the co-op admin covers it"}
                  </p>
                </div>
              </li>
            );
          })}
        </ol>
        {rejection && rejection.office === "PRESIDENT" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Rejected by the President ({rejection.memberName}) ·{" "}
            {formatDateLong(new Date(rejection.actedAt))}
          </p>
        ) : null}
        {status === "Awaiting Guarantor" ? (
          <p className="mt-4 text-xs text-muted-foreground">
            Approvals start once the guarantor accepts.
          </p>
        ) : null}
      </CardContent>
    </Card>
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

function GuarantorProfileCard({
  name,
  member,
}: {
  name: string;
  member?: CoopMember;
}) {
  return (
    <Card className="h-fit">
      <CardContent className="flex flex-col items-center gap-4 py-8 text-center">
        <span className="flex size-20 shrink-0 items-center justify-center rounded-full bg-primary text-xl font-semibold text-primary-foreground">
          {getInitials(name)}
        </span>
        <div className="w-full space-y-3 text-left">
          <ProfileField label="Full Name" value={name} />
          {member ? (
            <>
              <ProfileField label="Membership ID" value={member.id} />
              <ProfileField label="Email" value={member.email} />
              <ProfileField label="Country" value={member.country} />
              <ProfileField label="State" value={member.state} />
              <ProfileField label="Access" value={member.role} />
              <Link
                href={`/members/${member.id}`}
                className="block pt-1 text-sm font-semibold text-primary underline-offset-4 hover:underline"
              >
                View Full Profile
              </Link>
            </>
          ) : (
            <p className="text-xs text-muted-foreground">
              No member record on file for this guarantor — showing the name
              provided at application time.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function ProfileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-medium text-foreground">{value}</p>
    </div>
  );
}

function AcceptGuarantorDialog({
  record,
  currency,
  onConfirm,
}: {
  record: CoopLoanRecord;
  currency: string;
  onConfirm: (documentUrl?: string) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [fileError, setFileError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selected = event.target.files?.[0];
    event.target.value = "";
    if (!selected) return;
    if (selected.size > MAX_ATTACHMENT_BYTES) {
      setFileError(
        `"${selected.name}" is too large — limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }
    setFileError(null);
    setFile(selected);
  };

  const handleConfirm = async () => {
    setBusy(true);
    try {
      const documentUrl = file
        ? await uploadService.uploadAttachment(file)
        : undefined;
      await onConfirm(documentUrl);
      setOpen(false);
      setFile(null);
    } catch (error) {
      toast.error("Couldn't upload document", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger render={<Button type="button" />}>
        Accept Request
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Accept Request</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Are you sure you agree to stand as a guarantor for{" "}
          <span className="font-semibold text-foreground">
            {record.memberName}
          </span>
          , for a {record.loanType} of {formatMoney(record.amount, currency)}?
        </p>
        <div className="space-y-2">
          <Label>Guarantor Terms</Label>
          <p className="text-xs text-muted-foreground">
            Optional: attach proof of income (e.g. last month&apos;s payslip).
          </p>
          {file ? (
            <div className="flex items-center justify-between rounded-lg border border-border px-3 py-2 text-sm">
              <span className="flex min-w-0 items-center gap-2">
                <Paperclip
                  className="size-3.5 shrink-0 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="truncate">{file.name}</span>
              </span>
              <button
                type="button"
                onClick={() => setFile(null)}
                className="shrink-0 text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Remove file"
                disabled={busy}
              >
                Remove
              </button>
            </div>
          ) : (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
            >
              <Paperclip className="size-3.5" aria-hidden="true" />
              Choose file
            </Button>
          )}
          <input
            ref={fileInputRef}
            type="file"
            accept=".pdf,.png,.jpg,.jpeg"
            className="hidden"
            onChange={handleFileChange}
          />
          {fileError ? (
            <p className="text-sm text-destructive">{fileError}</p>
          ) : null}
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => setOpen(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button type="button" onClick={handleConfirm} disabled={busy}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Accept"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectGuarantorDialog({
  record,
  onConfirm,
}: {
  record: CoopLoanRecord;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" variant="outline" />}>
        Reject Request
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Reject guarantor request</AlertDialogTitle>
          <AlertDialogDescription>
            {record.guarantorName} will be recorded as declining to guarantee{" "}
            {record.memberName}&apos;s {record.loanType}. The loan is marked
            Rejected — no admin decision needed afterward.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant="destructive"
            disabled={busy}
            onClick={handleConfirm}
          >
            Reject
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function ApproveLoanDialog({
  record,
  currency,
  finalStep,
  netAmount,
  nextStepLabel,
  onConfirm,
}: {
  record: CoopLoanRecord;
  currency: string;
  finalStep: boolean;
  netAmount: number | null;
  nextStepLabel: string | null;
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm();
    setBusy(false);
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" />}>
        Approve Request
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {finalStep ? "Approve and pay out loan" : "Approve loan"}
          </AlertDialogTitle>
          <AlertDialogDescription>
            {finalStep ? (
              <>
                This is the final approval. It immediately sends{" "}
                {formatMoney(netAmount ?? record.amount, currency)}
                {netAmount != null && netAmount !== record.amount
                  ? " (after loan charges)"
                  : ""}{" "}
                to {record.memberName}&apos;s bank account and sets the loan
                Active. This can&apos;t be undone.
              </>
            ) : (
              <>
                {record.memberName}&apos;s{" "}
                {formatMoney(record.amount, currency)} {record.loanType} will
                pass to the {nextStepLabel ?? "next officer"} for approval.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleConfirm}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : finalStep ? (
              "Approve & pay out"
            ) : (
              "Approve"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function RejectLoanDialog({
  record,
  onConfirm,
}: {
  record: CoopLoanRecord;
  onConfirm: (reason: string) => Promise<void> | void;
}) {
  const reasonId = useId();
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);
  const [reason, setReason] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setReason("");
    setOpen(next);
  };

  const handleConfirm = async () => {
    setBusy(true);
    await onConfirm(reason.trim());
    setBusy(false);
    handleOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogTrigger render={<Button type="button" variant="outline" />}>
        Reject Request
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reject loan application</DialogTitle>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          {record.memberName} will see the reason you give below for their{" "}
          {record.loanType} application.
        </p>
        <div className="space-y-2">
          <Label htmlFor={reasonId}>Reason for rejection</Label>
          <Textarea
            id={reasonId}
            rows={3}
            placeholder="e.g. Insufficient savings history for this loan type."
            value={reason}
            onChange={(event) => setReason(event.target.value)}
            disabled={busy}
          />
        </div>
        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            onClick={() => handleOpenChange(false)}
            disabled={busy}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="destructive"
            disabled={busy || !reason.trim()}
            onClick={handleConfirm}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Reject"
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
