"use client";

import { use, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Banknote, Loader2, Paperclip } from "lucide-react";
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
  loanGuarantorsOf,
  loanStatusLabel,
  loanStatusLabelForStaff,
  type CoopLoanRecord,
  type CoopMember,
  type LoanGuarantorInfo,
} from "@/lib/coop-data";
import { MAX_ATTACHMENT_BYTES } from "@/lib/file-to-data-url";
import { formatDateLong, formatMoney, getInitials } from "@/lib/format";
import { useCoopLoanRecord, useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { useTabAccess } from "@/hooks/use-permission";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCurrency } from "@/components/providers/currency-provider";
import {
  useGuarantorResponse,
  useLoanApprovals,
  useLoanDecision,
} from "@/hooks/use-loans-self";
import { uploadService } from "@/services/upload.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";
import { loanModeLabel } from "@/lib/loans-data";
import { BorrowerHistoryCard } from "@/components/features/loans/borrower-history-card";
import {
  ApprovalSteps,
  ApproveLoanDialog,
  DisburseLoanDialog,
  LoanOfferCard,
} from "@/components/features/loans/loan-request-panels";

interface LoanRequestPageProps {
  params: Promise<{ recordId: string }>;
}

const plural = (n: number, one: string) => `${n} ${n === 1 ? one : `${one}s`}`;

export default function LoanRequestPage({ params }: LoanRequestPageProps) {
  const { recordId } = use(params);
  const router = useRouter();
  const authMember = useAuthStore((state) => state.member);
  const requestsAccess = useTabAccess("Loans", "Requests");
  const coopId =
    authMember?.cooperativeId ??
    (authMember?.role === "admin" ? authMember.id : undefined);

  const { data: record, isLoading } = useCoopLoanRecord(recordId);
  // Plain members can't load the co-op itself; the currency comes from the app's provider.
  const currency = useCurrency();
  const { data: members = [] } = useCoopMembers(coopId);
  const { data: loanTypes = [] } = useCoopLoanTypes(coopId);
  const guarantorResponse = useGuarantorResponse(coopId ?? "");
  const loanDecision = useLoanDecision(coopId ?? "");
  const { data: approvals } = useLoanApprovals(coopId, recordId);
  const [approveOpen, setApproveOpen] = useState(false);
  const [disburseOpen, setDisburseOpen] = useState(false);

  if (isLoading) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  if (!record) {
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

  const isBorrower = record.memberId === authMember?.id;
  const loanType = loanTypes.find((type) => type.name === record.loanType);
  const guarantors = loanGuarantorsOf(record);
  const myPendingGuarantee = guarantors.find(
    (g) => g.memberId === authMember?.id && g.status === "Pending",
  );

  const handleGuarantorAccept = async (documentUrl?: string) => {
    try {
      await guarantorResponse.mutateAsync({
        loanId: record.id,
        decision: "Accepted",
        documentUrl,
      });
      toast.success("You've accepted", {
        description:
          "The loan goes to the loan committee once every guarantor has accepted.",
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

  const handleApprove = async (
    amount: number,
    months: number,
    note: string,
  ) => {
    try {
      const updated = await loanDecision.mutateAsync({
        loanId: record.id,
        decision: "Approved",
        suggestedAmount: amount,
        suggestedMonths: months,
        note: note || undefined,
      });
      setApproveOpen(false);
      toast.success(
        updated.status === "Awaiting Acceptance"
          ? "Approved. The offer has gone to the borrower"
          : `Approved at ${formatMoney(amount, currency)} over ${plural(months, "month")}`,
        {
          description:
            updated.status === "Awaiting Acceptance"
              ? `${record.memberName} is asked to accept ${formatMoney(amount, currency)} over ${plural(months, "month")}.`
              : updated.approvalStepTitle
                ? `Next: ${updated.approvalStepTitle}.`
                : undefined,
        },
      );
    } catch (error) {
      toast.error("Couldn't approve", {
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

  const showGuarantorCard = guarantors.length > 0;
  // Only a guarantor who hasn't answered yet can accept or decline — the backend enforces it too.
  const showGuarantorActions =
    record.status === "Awaiting Guarantor" && !!myPendingGuarantee;
  // A committee seat is the authority to approve, whatever the person's role.
  const canApprove = !!approvals?.canApprove;
  const canReject =
    !!approvals?.canReject &&
    (approvals.canApprove ||
      authMember?.permissionModules == null ||
      requestsAccess === "write");
  const canDisburse = !!approvals?.canDisburse;
  const requested = record.requestedAmount ?? record.amount;
  const requestedMonths = record.requestedMonths ?? record.durationMonths;
  const statusText = isBorrower
    ? loanStatusLabel(record)
    : loanStatusLabelForStaff(record);

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
            <GuarantorsCard guarantors={guarantors} members={members} />
          </div>
        ) : null}

        <div
          className={cn(
            "space-y-4",
            showGuarantorCard ? "lg:col-span-2" : undefined,
          )}
        >
          {approvals?.canRespondToOffer && coopId ? (
            <LoanOfferCard
              coopId={coopId}
              record={record}
              approvals={approvals}
              currency={currency}
            />
          ) : null}

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
                    currency={currency}
                    onConfirm={handleGuarantorAccept}
                  />
                </div>
              ) : canApprove || canReject || canDisburse ? (
                <div className="flex flex-wrap items-center gap-2">
                  {canDisburse ? (
                    <span className="text-sm text-muted-foreground">
                      Accepted by {record.memberName} · ready to pay out
                    </span>
                  ) : approvals?.actingAs ? (
                    <span className="text-sm text-muted-foreground">
                      {approvals.canApprove
                        ? `You're the ${approvals.actingAs}`
                        : `Acting as ${approvals.actingAs}`}
                    </span>
                  ) : null}
                  {canReject ? (
                    <RejectLoanDialog
                      record={record}
                      onConfirm={handleReject}
                    />
                  ) : null}
                  {canApprove ? (
                    <Button onClick={() => setApproveOpen(true)}>
                      Approve Request
                    </Button>
                  ) : null}
                  {canDisburse ? (
                    <Button onClick={() => setDisburseOpen(true)}>
                      <Banknote className="size-4" aria-hidden="true" />
                      Disburse
                    </Button>
                  ) : null}
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Loan Type" value={record.loanType} />
              <Field
                label="Loan Amount"
                value={
                  <>
                    {formatMoney(record.amount, currency)}
                    {requested !== record.amount ? (
                      <span className="block text-xs font-medium text-muted-foreground">
                        Requested {formatMoney(requested, currency)}
                      </span>
                    ) : null}
                  </>
                }
              />
              <Field
                label="Interest Rate"
                value={`${record.interestRate}% flat`}
              />
              <Field
                label="Repayment Period"
                value={
                  <>
                    {plural(record.durationMonths, "month")}
                    {requestedMonths !== record.durationMonths ? (
                      <span className="block text-xs font-medium text-muted-foreground">
                        Requested {plural(requestedMonths, "month")}
                      </span>
                    ) : null}
                  </>
                }
              />
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
                    href={`/members/${record.memberId}`}
                    className="font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    {record.memberName}
                  </Link>
                }
              />
              <Field label="Loan Mode" value={loanModeLabel(record.loanMode)} />
              <Field
                label={guarantors.length > 1 ? "Guarantors" : "Guarantor"}
                value={
                  guarantors.length > 0
                    ? guarantors.map((g) => g.name).join(", ")
                    : "None (Within loan)"
                }
              />
              <div className="space-y-1">
                <p className="text-xs text-muted-foreground">Status</p>
                <Badge variant={coopLoanStatusBadgeVariant(record.status)}>
                  {statusText}
                </Badge>
              </div>
              {record.payoutAccountName ? (
                <Field
                  label="Pays into"
                  value={
                    <>
                      {record.payoutAccountName}
                      <span className="block text-xs font-medium text-muted-foreground">
                        {[
                          record.payoutBankName,
                          record.payoutAccountNumber
                            ? `••••${record.payoutAccountNumber.slice(-4)}`
                            : null,
                          record.payoutAccountType === "Other"
                            ? "Another account"
                            : "Registered account",
                        ]
                          .filter(Boolean)
                          .join(" · ")}
                      </span>
                    </>
                  }
                />
              ) : null}
              {record.disbursedAmount != null ? (
                <Field
                  label="Paid Out"
                  value={
                    <>
                      {formatMoney(record.disbursedAmount, currency)}
                      <span className="block text-xs font-medium text-muted-foreground">
                        {record.disbursementMethod === "Cheque"
                          ? `Cheque${record.chequeNumber ? ` No. ${record.chequeNumber}` : ""}`
                          : "Online transfer"}
                        {record.disbursedAt
                          ? ` · ${formatDateLong(new Date(record.disbursedAt))}`
                          : ""}
                      </span>
                      {record.chequeUrl ? (
                        <a
                          href={record.chequeUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="text-xs font-semibold text-primary underline-offset-4 hover:underline"
                        >
                          View cheque
                        </a>
                      ) : null}
                    </>
                  }
                />
              ) : null}
              {record.rejectionReason ? (
                <Field
                  label={
                    record.status === "Declined"
                      ? "Declined"
                      : "Rejection Reason"
                  }
                  value={record.rejectionReason}
                  className="sm:col-span-2 lg:col-span-4"
                />
              ) : null}
            </CardContent>
          </Card>

          {approvals ? (
            <ApprovalSteps
              approvals={approvals}
              record={record}
              currency={currency}
            />
          ) : null}

          {!isBorrower ? (
            <BorrowerHistoryCard
              coopId={coopId}
              memberId={record.memberId}
              currency={currency}
              excludeLoanId={record.id}
            />
          ) : null}
        </div>
      </div>

      {approvals && canApprove ? (
        <ApproveLoanDialog
          open={approveOpen}
          onOpenChange={setApproveOpen}
          record={record}
          approvals={approvals}
          loanType={loanType}
          currency={currency}
          busy={loanDecision.isPending}
          onConfirm={handleApprove}
        />
      ) : null}
      {approvals && canDisburse && coopId ? (
        <DisburseLoanDialog
          open={disburseOpen}
          onOpenChange={setDisburseOpen}
          record={record}
          approvals={approvals}
          currency={currency}
          coopId={coopId}
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

/** Every guarantor on the loan and where each stands. The loan reaches the officers only once
 * all of them have accepted; one decline rejects it. */
function GuarantorsCard({
  guarantors,
  members,
}: {
  guarantors: LoanGuarantorInfo[];
  members: CoopMember[];
}) {
  const accepted = guarantors.filter((g) => g.status === "Accepted").length;
  return (
    <Card className="h-fit">
      <CardHeader>
        <CardTitle>Guarantors</CardTitle>
        <p className="text-xs text-muted-foreground">
          {accepted} of {guarantors.length} accepted
        </p>
      </CardHeader>
      <CardContent className="space-y-3">
        {guarantors.map((guarantor) => {
          const member = members.find((m) => m.id === guarantor.memberId);
          return (
            <div
              key={guarantor.memberId}
              className="flex items-start gap-3 rounded-xl border border-border p-3"
            >
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                {getInitials(guarantor.name)}
              </span>
              <div className="min-w-0 flex-1 space-y-1">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <p className="truncate text-sm font-medium text-foreground">
                    {guarantor.name}
                  </p>
                  <Badge
                    variant="secondary"
                    className={cn(
                      guarantor.status === "Accepted" &&
                        "bg-success/15 text-success",
                      guarantor.status === "Declined" &&
                        "bg-destructive/15 text-destructive",
                    )}
                  >
                    {guarantor.status}
                  </Badge>
                </div>
                <p className="text-xs text-muted-foreground">
                  {guarantor.memberId}
                  {member?.role === "Admin" ? " · Admin" : ""}
                </p>
                {guarantor.documentUrl ? (
                  <a
                    href={guarantor.documentUrl}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs font-medium text-primary underline-offset-4 hover:underline"
                  >
                    Proof of income
                  </a>
                ) : null}
                {member ? (
                  <Link
                    href={`/members/${member.id}`}
                    className="block text-xs font-semibold text-primary underline-offset-4 hover:underline"
                  >
                    View profile
                  </Link>
                ) : null}
              </div>
            </div>
          );
        })}
      </CardContent>
    </Card>
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
            You&apos;ll be recorded as declining to guarantee{" "}
            {record.memberName}&apos;s {record.loanType}. A loan needs every
            guarantor to accept, so it will be marked Rejected.
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
