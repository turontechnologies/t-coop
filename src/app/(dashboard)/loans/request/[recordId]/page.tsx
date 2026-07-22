"use client";

import { use, useId, useRef, useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Paperclip } from "lucide-react";
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
import {
  MAX_ATTACHMENT_BYTES,
  readFileAsDataUrl,
} from "@/lib/file-to-data-url";
import { formatDateLong, formatNaira, getInitials } from "@/lib/format";
import { getDirectoryCoop } from "@/lib/member-directory";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface LoanRequestPageProps {
  params: Promise<{ recordId: string }>;
}

export default function LoanRequestPage({ params }: LoanRequestPageProps) {
  const { recordId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const respondToGuarantorRequest = useCoopStore(
    (state) => state.respondToGuarantorRequest,
  );
  const resolveLoanRequest = useCoopStore((state) => state.resolveLoanRequest);
  const coop = getDirectoryCoop(cooperatives);
  const record = coop?.loans.find((item) => item.id === recordId);

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

  const guarantorMember = coop.members.find(
    (m) => coopMemberFullName(m) === record.guarantorName,
  );

  const handleGuarantorAccept = async (documentUrl?: string) => {
    respondToGuarantorRequest(coop.id, record.id, "Accepted", documentUrl);
    toast.success("Guarantor accepted", {
      description: `${record.guarantorName} has agreed to guarantee this loan — now awaiting your decision.`,
    });
  };

  const handleGuarantorReject = async () => {
    respondToGuarantorRequest(coop.id, record.id, "Rejected");
    toast.success("Guarantor request declined", {
      description: `Recorded as declined for ${record.memberName}'s loan.`,
    });
  };

  const handleApprove = async () => {
    resolveLoanRequest(coop.id, record.id, "Approved");
    toast.success("Loan approved and disbursed", {
      description: `${formatNaira(record.amount)} marked as paid out to ${record.memberName}.`,
    });
  };

  const handleReject = async (reason: string) => {
    resolveLoanRequest(coop.id, record.id, "Rejected", reason);
    toast.success("Loan rejected", {
      description: `${record.memberName} will see this reason: "${reason}"`,
    });
  };

  const showGuarantorActions = record.status === "Awaiting Guarantor";
  const showAdminActions = record.status === "Awaiting Admin";

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
          showGuarantorActions && "lg:grid-cols-3",
        )}
      >
        {showGuarantorActions ? (
          <div className="lg:col-span-1">
            <GuarantorProfileCard
              name={record.guarantorName}
              member={guarantorMember}
            />
          </div>
        ) : null}

        <div className={cn(showGuarantorActions ? "lg:col-span-2" : undefined)}>
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
                    onConfirm={handleGuarantorAccept}
                  />
                </div>
              ) : showAdminActions ? (
                <div className="flex items-center gap-2">
                  <RejectLoanDialog record={record} onConfirm={handleReject} />
                  <ApproveLoanDialog
                    record={record}
                    onConfirm={handleApprove}
                  />
                </div>
              ) : null}
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-x-8 gap-y-6 sm:grid-cols-2 lg:grid-cols-4">
              <Field label="Loan Type" value={record.loanType} />
              <Field label="Loan Amount" value={formatNaira(record.amount)} />
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
                value={formatNaira(record.monthlyRepayment)}
              />
              <Field
                label="Total Repayment"
                value={formatNaira(record.totalRepayment)}
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
        </div>
      </div>
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
  onConfirm,
}: {
  record: CoopLoanRecord;
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
    const documentUrl = file ? await readFileAsDataUrl(file) : undefined;
    await new Promise((resolve) => setTimeout(resolve, 500));
    await onConfirm(documentUrl);
    setBusy(false);
    setOpen(false);
    setFile(null);
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
          , for a {record.loanType} of {formatNaira(record.amount)}?
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
      <AlertDialogTrigger render={<Button type="button" />}>
        Approve Request
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Approve and disburse loan</AlertDialogTitle>
          <AlertDialogDescription>
            This marks {formatNaira(record.amount)} as paid out to{" "}
            {record.memberName} and sets the loan Active. This app has no real
            payout capability (no backend/Transfers API) — this simulates the
            disbursement honestly, the same way every other mock action here
            does.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleConfirm}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
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
