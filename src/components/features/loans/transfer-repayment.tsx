"use client";

import { useEffect, useId, useRef, useState } from "react";
import Link from "next/link";
import {
  AlertCircle,
  Check,
  Clock,
  FileText,
  Landmark,
  Loader2,
  Minus,
  Plus,
  Receipt,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  useDecideTransferClaim,
  useNextInstallment,
  useSubmitTransferClaim,
} from "@/hooks/use-loan-repayments";
import { formatDateLong, formatMoney, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { TransferClaim } from "@/services/loan-repayment.service";
import { uploadService } from "@/services/upload.service";

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;
const todayIso = () => new Date().toISOString().slice(0, 10);

/**
 * The borrower paid by bank transfer outside the platform: they say how many installments it
 * covers and upload the receipt. It counts once the co-op confirms it.
 */
export function TransferRepaymentDialog({
  coopId,
  loanId,
  currency,
  open,
  onOpenChange,
}: {
  coopId: string;
  loanId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const [count, setCount] = useState(1);
  const { data: next, isFetching } = useNextInstallment(
    coopId,
    loanId,
    open,
    count,
  );
  const submitClaim = useSubmitTransferClaim(coopId, loanId);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [paidOn, setPaidOn] = useState(todayIso);
  const [reference, setReference] = useState("");
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const dateId = useId();
  const refId = useId();
  const noteId = useId();

  useEffect(() => {
    if (!open) {
      setCount(1);
      setReceipt(null);
      setPreview(null);
      setPaidOn(todayIso());
      setReference("");
      setNote("");
      setProblem(null);
    }
  }, [open]);

  const remaining = next?.remainingInstallments ?? 1;
  const working = uploading || submitClaim.isPending;

  const takeReceipt = (file: File | undefined) => {
    setProblem(null);
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setProblem(
        "Upload a photo (JPG or PNG) or a PDF of the transfer receipt.",
      );
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setProblem("That file is over 5 MB. Try a smaller photo.");
      return;
    }
    setReceipt(file);
    setPreview(/^image\//.test(file.type) ? URL.createObjectURL(file) : null);
  };

  const submit = async () => {
    setProblem(null);
    if (!receipt) {
      setProblem(
        "Upload the transfer receipt so the co-operative can check it.",
      );
      return;
    }
    try {
      setUploading(true);
      const receiptUrl = await uploadService.uploadAttachment(receipt);
      setUploading(false);
      const claim = await submitClaim.mutateAsync({
        installments: count,
        receiptUrl,
        paidOn,
        transferReference: reference.trim() || undefined,
        note: note.trim() || undefined,
      });
      onOpenChange(false);
      toast.success("Sent for confirmation", {
        description: `Your ${formatMoney(claim.amount, currency)} transfer counts once the co-operative confirms it. You'll get a notification.`,
      });
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "Couldn't send your transfer.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !working && onOpenChange(value)}
    >
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-md">
        <DialogHeader>
          <DialogTitle>I paid by bank transfer</DialogTitle>
          <DialogDescription>
            Paid into the co-operative&apos;s bank account yourself? Send the
            receipt here. It counts towards your loan once the co-operative
            confirms the money arrived.
          </DialogDescription>
        </DialogHeader>

        {next?.pendingClaim ? (
          <p className="flex items-start gap-2 rounded-xl bg-amber-500/10 px-3.5 py-3 text-sm text-amber-700 dark:text-amber-300">
            <Clock className="mt-0.5 size-4 shrink-0" aria-hidden="true" />
            You already have a transfer waiting to be confirmed. You can send
            another once it&apos;s been checked.
          </p>
        ) : null}

        <div className="space-y-4">
          <div className="rounded-2xl border border-border bg-muted/40 p-4">
            <p className="text-xs font-semibold text-muted-foreground">
              Installments this transfer covers
            </p>
            <div className="mt-2 flex items-center justify-between gap-3">
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="Fewer installments"
                  disabled={count <= 1 || working}
                  onClick={() => setCount((value) => Math.max(1, value - 1))}
                >
                  <Minus className="size-4" aria-hidden="true" />
                </Button>
                <span className="w-8 text-center text-lg font-semibold tabular-nums">
                  {count}
                </span>
                <Button
                  type="button"
                  variant="outline"
                  size="icon-sm"
                  aria-label="More installments"
                  disabled={count >= remaining || working}
                  onClick={() =>
                    setCount((value) => Math.min(remaining, value + 1))
                  }
                >
                  <Plus className="size-4" aria-hidden="true" />
                </Button>
              </div>
              <div className="text-right">
                <p
                  className={cn(
                    "text-xl font-semibold text-foreground tabular-nums transition-opacity",
                    isFetching && "opacity-50",
                  )}
                >
                  {next ? formatMoney(next.amount, currency) : "…"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {next
                    ? count === remaining
                      ? "Clears the loan"
                      : `${remaining - count} installment${remaining - count === 1 ? "" : "s"} left after this`
                    : " "}
                </p>
              </div>
            </div>
          </div>

          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor={dateId}>Date you paid</Label>
              <Input
                id={dateId}
                type="date"
                max={todayIso()}
                value={paidOn}
                onChange={(event) => setPaidOn(event.target.value)}
                disabled={working}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor={refId}>
                Transfer reference{" "}
                <span className="font-normal text-muted-foreground">
                  (optional)
                </span>
              </Label>
              <Input
                id={refId}
                maxLength={100}
                value={reference}
                onChange={(event) => setReference(event.target.value)}
                placeholder="From your bank app"
                disabled={working}
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Transfer receipt</Label>
            <input
              ref={inputRef}
              type="file"
              accept="image/*,application/pdf"
              className="sr-only"
              aria-label="Upload transfer receipt"
              onChange={(event) => {
                takeReceipt(event.target.files?.[0]);
                event.target.value = "";
              }}
            />
            {receipt ? (
              <div className="flex items-center gap-3 rounded-xl border border-border p-3">
                {preview ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={preview}
                    alt="Receipt preview"
                    className="size-14 rounded-lg object-cover"
                  />
                ) : (
                  <span className="flex size-14 items-center justify-center rounded-lg bg-muted">
                    <FileText
                      className="size-6 text-muted-foreground"
                      aria-hidden="true"
                    />
                  </span>
                )}
                <p className="min-w-0 flex-1 truncate text-sm font-medium text-foreground">
                  {receipt.name}
                </p>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon-sm"
                  aria-label="Remove receipt"
                  disabled={working}
                  onClick={() => {
                    setReceipt(null);
                    setPreview(null);
                  }}
                >
                  <X className="size-4" aria-hidden="true" />
                </Button>
              </div>
            ) : (
              <button
                type="button"
                disabled={working}
                onClick={() => inputRef.current?.click()}
                onDragOver={(event) => event.preventDefault()}
                onDrop={(event) => {
                  event.preventDefault();
                  takeReceipt(event.dataTransfer.files?.[0]);
                }}
                className="flex w-full flex-col items-center gap-1.5 rounded-xl border border-dashed border-border px-4 py-6 text-center transition-colors hover:bg-muted/50"
              >
                <Upload
                  className="size-5 text-muted-foreground"
                  aria-hidden="true"
                />
                <span className="text-sm font-medium text-foreground">
                  Upload the receipt or a screenshot
                </span>
                <span className="text-xs text-muted-foreground">
                  Photo or PDF, up to 5 MB
                </span>
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            <Label htmlFor={noteId}>Note (optional)</Label>
            <Textarea
              id={noteId}
              value={note}
              maxLength={500}
              rows={2}
              onChange={(event) => setNote(event.target.value)}
              placeholder="e.g. Paid from my GTBank account"
              disabled={working}
            />
          </div>

          {problem ? (
            <p
              role="alert"
              className="flex items-start gap-2 rounded-xl bg-destructive/10 px-3.5 py-3 text-sm text-destructive"
            >
              <AlertCircle
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              {problem}
            </p>
          ) : null}
        </div>

        <DialogFooter>
          <Button
            type="button"
            variant="ghost"
            disabled={working}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            type="button"
            disabled={working || !next || next.pendingClaim}
            onClick={submit}
          >
            {working ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Landmark className="size-4" aria-hidden="true" />
            )}
            {uploading ? "Uploading…" : "Send for confirmation"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

const STATUS_STYLE: Record<TransferClaim["status"], string> = {
  Pending: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  Confirmed: "bg-success/15 text-success",
  Rejected: "bg-destructive/15 text-destructive",
};

export function TransferClaimStatus({
  status,
}: {
  status: TransferClaim["status"];
}) {
  return (
    <Badge variant="secondary" className={STATUS_STYLE[status]}>
      {status === "Pending" ? "Waiting for confirmation" : status}
    </Badge>
  );
}

/** Confirm / Reject for staff — rejecting asks why, and the member is told. */
export function TransferClaimActions({
  coopId,
  claim,
  currency,
}: {
  coopId: string;
  claim: TransferClaim;
  currency: string;
}) {
  const decide = useDecideTransferClaim(coopId);
  const [rejecting, setRejecting] = useState(false);
  const [reason, setReason] = useState("");
  const busy = decide.isPending;

  const run = async (decision: "Confirmed" | "Rejected") => {
    try {
      await decide.mutateAsync({
        claimId: claim.id,
        loanId: claim.loanId,
        decision,
        reason: decision === "Rejected" ? reason : undefined,
      });
      setRejecting(false);
      toast.success(
        decision === "Confirmed" ? "Transfer confirmed" : "Transfer rejected",
        {
          description:
            decision === "Confirmed"
              ? `${formatMoney(claim.amount, currency)} counted towards ${claim.memberName}'s loan.`
              : `${claim.memberName} has been told why.`,
        },
      );
    } catch (error) {
      toast.error("Couldn't save that", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <Button size="sm" disabled={busy} onClick={() => run("Confirmed")}>
          {busy ? (
            <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
          ) : (
            <Check className="size-3.5" aria-hidden="true" />
          )}
          Confirm
        </Button>
        <Button
          size="sm"
          variant="outline"
          disabled={busy}
          onClick={() => setRejecting(true)}
        >
          Reject
        </Button>
      </div>
      <Dialog
        open={rejecting}
        onOpenChange={(value) => !busy && setRejecting(value)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Reject this transfer?</DialogTitle>
            <DialogDescription>
              {claim.memberName}&apos;s {formatMoney(claim.amount, currency)}{" "}
              transfer won&apos;t count towards their loan. Tell them why so
              they can sort it out.
            </DialogDescription>
          </DialogHeader>
          <Textarea
            value={reason}
            maxLength={500}
            rows={3}
            onChange={(event) => setReason(event.target.value)}
            placeholder="e.g. We can't find this transfer in our account"
          />
          <DialogFooter>
            <Button
              variant="ghost"
              disabled={busy}
              onClick={() => setRejecting(false)}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={busy}
              onClick={() => run("Rejected")}
            >
              Reject transfer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

function ClaimDetails({
  claim,
  currency,
  showMember,
}: {
  claim: TransferClaim;
  currency: string;
  showMember?: boolean;
}) {
  return (
    <div className="min-w-0 space-y-1">
      <div className="flex flex-wrap items-center gap-2">
        {showMember ? (
          <Link
            href={`/loans/${claim.loanId}`}
            className="font-semibold text-foreground hover:underline"
          >
            {claim.memberName}
          </Link>
        ) : null}
        <span className="font-semibold text-foreground tabular-nums">
          {formatMoney(claim.amount, currency)}
        </span>
        <TransferClaimStatus status={claim.status} />
      </div>
      <p className="text-xs text-muted-foreground">
        {showMember ? `${claim.loanTypeName} · ` : ""}
        {claim.installments} installment{claim.installments === 1 ? "" : "s"} ·
        paid {formatDateLong(new Date(claim.paidOn))}
        {claim.transferReference ? ` · Ref ${claim.transferReference}` : ""} ·
        sent {formatTimeAgo(claim.submittedAt)}
      </p>
      {claim.note ? (
        <p className="text-xs text-muted-foreground">“{claim.note}”</p>
      ) : null}
      {claim.status === "Rejected" && claim.rejectionReason ? (
        <p className="text-xs text-destructive">
          Not confirmed: {claim.rejectionReason}
        </p>
      ) : null}
      {claim.status === "Confirmed" && claim.decidedByName ? (
        <p className="text-xs text-muted-foreground">
          Confirmed by {claim.decidedByName}
        </p>
      ) : null}
      <a
        href={claim.receiptUrl}
        target="_blank"
        rel="noreferrer"
        className="inline-flex items-center gap-1 text-xs font-medium text-primary hover:underline"
      >
        <Receipt className="size-3.5" aria-hidden="true" />
        View receipt
      </a>
    </div>
  );
}

/** One loan's bank transfers, shown on the loan page (pending ones first). */
export function LoanTransferClaims({
  coopId,
  claims,
  currency,
  canDecide,
}: {
  coopId: string;
  claims: TransferClaim[];
  currency: string;
  canDecide: boolean;
}) {
  if (claims.length === 0) return null;
  const sorted = [...claims].sort(
    (a, b) =>
      Number(b.status === "Pending") - Number(a.status === "Pending") ||
      b.submittedAt.localeCompare(a.submittedAt),
  );
  return (
    <div className="space-y-2">
      <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
        Bank transfers
      </p>
      <ul className="space-y-2">
        {sorted.slice(0, 5).map((claim) => (
          <li
            key={claim.id}
            className={cn(
              "flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border px-4 py-3",
              claim.status === "Pending" &&
                "border-amber-500/40 bg-amber-500/5",
            )}
          >
            <ClaimDetails claim={claim} currency={currency} />
            {canDecide && claim.status === "Pending" ? (
              <TransferClaimActions
                coopId={coopId}
                claim={claim}
                currency={currency}
              />
            ) : null}
          </li>
        ))}
      </ul>
    </div>
  );
}

/** Loans → Bank transfers: every transfer members sent, waiting ones first. */
export function TransferClaimsQueue({
  coopId,
  claims,
  currency,
  canDecide,
}: {
  coopId: string;
  claims: TransferClaim[];
  currency: string;
  canDecide: boolean;
}) {
  const [filter, setFilter] = useState<"Pending" | "All">("Pending");
  const shown =
    filter === "Pending"
      ? claims.filter((claim) => claim.status === "Pending")
      : claims;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm text-muted-foreground">
          Members who repaid by bank transfer outside the platform. Check your
          bank, then confirm so it counts towards their loan.
        </p>
        <div className="inline-flex rounded-lg border border-border p-0.5">
          {(["Pending", "All"] as const).map((value) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "rounded-md px-3 py-1 text-xs font-semibold transition-colors",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              {value === "Pending" ? "To confirm" : "All"}
            </button>
          ))}
        </div>
      </div>
      {shown.length === 0 ? (
        <p className="rounded-xl border border-dashed border-border px-4 py-10 text-center text-sm text-muted-foreground">
          {filter === "Pending"
            ? "Nothing to confirm. You're all caught up."
            : "No member has sent a bank transfer yet."}
        </p>
      ) : (
        <ul className="space-y-2">
          {shown.map((claim) => (
            <li
              key={claim.id}
              className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-border px-4 py-3"
            >
              <ClaimDetails claim={claim} currency={currency} showMember />
              {canDecide && claim.status === "Pending" ? (
                <TransferClaimActions
                  coopId={coopId}
                  claim={claim}
                  currency={currency}
                />
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
