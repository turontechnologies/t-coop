"use client";

import { useMemo, useState } from "react";
import { ArrowDownToLine, ArrowUpFromLine, Loader2 } from "lucide-react";
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
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { SavingsRequest } from "@/lib/coop-data";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { uploadService } from "@/services/upload.service";
import type { WithdrawalPayout } from "@/services/savings-self.service";

const PAYOUT_MODES: {
  value: WithdrawalPayout["method"];
  title: string;
  body: string;
}[] = [
  {
    value: "Online",
    title: "Pay online now",
    body: "The platform sends it to the member's bank account.",
  },
  {
    value: "Transfer",
    title: "Already paid by bank transfer",
    body: "You sent it from the co-op's bank. Attach the receipt.",
  },
  {
    value: "Cheque",
    title: "Paid by cheque",
    body: "Attach a photo of the cheque.",
  },
  {
    value: "Cash",
    title: "Paid in cash",
    body: "Handed over at the office. A receipt is optional.",
  },
];

interface SavingsRequestsTableProps {
  requests: SavingsRequest[];
  /** Hides the Approve/Decline actions for a read-only viewer — defaults to true so every
   * existing caller (which never restricts this) keeps working unchanged. */
  canResolve?: boolean;
  onResolve: (
    requestId: string,
    status: "Approved" | "Declined",
    reason?: string,
    payout?: WithdrawalPayout,
  ) => Promise<void> | void;
}

export function SavingsRequestsTable({
  requests,
  canResolve = true,
  onResolve,
}: SavingsRequestsTableProps) {
  const currency = useCurrency();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [type, setType] = useState<string>("All types");

  const typeOptions = useMemo(
    () => [
      "All types",
      ...Array.from(new Set(requests.map((request) => request.savingsType))),
    ],
    [requests],
  );

  const filtered = useMemo(
    () =>
      type === "All types"
        ? requests
        : requests.filter((request) => request.savingsType === type),
    [requests, type],
  );

  const handleResolve = async (
    requestId: string,
    status: "Approved" | "Declined",
    reason?: string,
    payout?: WithdrawalPayout,
  ) => {
    setBusyId(requestId);
    await onResolve(requestId, status, reason, payout);
    setBusyId(null);
  };

  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No savings requests yet.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select
          value={type}
          onValueChange={(value) => setType(value ?? "All types")}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All types" ? "By savings type" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Member
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Savings Type
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Amount
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Requested
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Status
              </th>
              <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                Action
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No savings requests match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((request) => {
                const busy = busyId === request.id;
                return (
                  <tr
                    key={request.id}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {request.memberName}
                    </td>
                    <td className="px-4 py-3">
                      <Badge variant="outline" className="gap-1 font-normal">
                        {request.type === "Deposit" ? (
                          <ArrowDownToLine
                            className="size-3 text-success"
                            aria-hidden="true"
                          />
                        ) : (
                          <ArrowUpFromLine
                            className="size-3 text-destructive"
                            aria-hidden="true"
                          />
                        )}
                        {request.type}
                      </Badge>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {request.savingsType}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMoney(request.amount, currency)}
                      {request.type === "Withdrawal" &&
                      request.netAmount != null ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {formatMoney(request.netAmount, currency)} net (
                          {request.feePercent}% fee)
                        </span>
                      ) : null}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatTimeAgo(request.requestedAt)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          request.status === "Approved"
                            ? "secondary"
                            : request.status === "Pending"
                              ? "outline"
                              : "destructive"
                        }
                        className={cn(
                          request.status === "Approved" &&
                            "bg-success/15 text-success",
                        )}
                      >
                        {request.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      {request.status === "Pending" && canResolve ? (
                        <div className="flex items-center gap-2">
                          <ConfirmResolveDialog
                            request={request}
                            status="Approved"
                            busy={busy}
                            onConfirm={(_reason, payout) =>
                              handleResolve(
                                request.id,
                                "Approved",
                                undefined,
                                payout,
                              )
                            }
                          />
                          <ConfirmResolveDialog
                            request={request}
                            status="Declined"
                            busy={busy}
                            onConfirm={(reason) =>
                              handleResolve(request.id, "Declined", reason)
                            }
                          />
                        </div>
                      ) : (
                        <span className="block max-w-56 text-xs text-muted-foreground">
                          {request.resolvedAt
                            ? formatTimeAgo(request.resolvedAt)
                            : "—"}
                          {request.declineReason ? (
                            <span className="mt-0.5 block text-destructive/90">
                              {request.declineReason}
                            </span>
                          ) : null}
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={filtered.length === 0}
        emptyMessage="No savings requests match your filter."
      >
        {filtered.map((request) => {
          const busy = busyId === request.id;
          return (
            <MobileRecordCard
              key={request.id}
              title={request.memberName}
              badge={
                <Badge
                  variant={
                    request.status === "Approved"
                      ? "secondary"
                      : request.status === "Pending"
                        ? "outline"
                        : "destructive"
                  }
                  className={cn(
                    request.status === "Approved" &&
                      "bg-success/15 text-success",
                  )}
                >
                  {request.status}
                </Badge>
              }
              fields={[
                {
                  label: "Type",
                  value: (
                    <Badge variant="outline" className="gap-1 font-normal">
                      {request.type === "Deposit" ? (
                        <ArrowDownToLine
                          className="size-3 text-success"
                          aria-hidden="true"
                        />
                      ) : (
                        <ArrowUpFromLine
                          className="size-3 text-destructive"
                          aria-hidden="true"
                        />
                      )}
                      {request.type}
                    </Badge>
                  ),
                },
                { label: "Savings Type", value: request.savingsType },
                {
                  label: "Amount",
                  value: (
                    <>
                      {formatMoney(request.amount, currency)}
                      {request.type === "Withdrawal" &&
                      request.netAmount != null ? (
                        <span className="block text-xs font-normal text-muted-foreground">
                          {formatMoney(request.netAmount, currency)} net (
                          {request.feePercent}% fee)
                        </span>
                      ) : null}
                    </>
                  ),
                },
                {
                  label: "Requested",
                  value: formatTimeAgo(request.requestedAt),
                },
              ]}
              actions={
                request.status === "Pending" && canResolve ? (
                  <>
                    <ConfirmResolveDialog
                      request={request}
                      status="Approved"
                      busy={busy}
                      onConfirm={(_reason, payout) =>
                        handleResolve(request.id, "Approved", undefined, payout)
                      }
                    />
                    <ConfirmResolveDialog
                      request={request}
                      status="Declined"
                      busy={busy}
                      onConfirm={(reason) =>
                        handleResolve(request.id, "Declined", reason)
                      }
                    />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {request.resolvedAt
                      ? `Resolved ${formatTimeAgo(request.resolvedAt)}`
                      : "—"}
                    {request.declineReason ? ` · ${request.declineReason}` : ""}
                  </span>
                )
              }
            />
          );
        })}
      </MobileRecordList>
    </div>
  );
}

function ConfirmResolveDialog({
  request,
  status,
  busy,
  onConfirm,
}: {
  request: SavingsRequest;
  status: "Approved" | "Declined";
  busy: boolean;
  onConfirm: (
    reason?: string,
    payout?: WithdrawalPayout,
  ) => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const [reason, setReason] = useState("");
  const [mode, setMode] = useState<WithdrawalPayout["method"]>("Online");
  const [proof, setProof] = useState<File | null>(null);
  const [reference, setReference] = useState("");
  const [uploading, setUploading] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const isApprove = status === "Approved";
  const currency = useCurrency();

  const handleConfirm = async () => {
    setProblem(null);
    let payout: WithdrawalPayout | undefined;
    if (isApprove) {
      if ((mode === "Transfer" || mode === "Cheque") && !proof) {
        setProblem(
          mode === "Cheque"
            ? "Attach a photo of the cheque first."
            : "Attach the transfer receipt first.",
        );
        return;
      }
      let receiptUrl: string | undefined;
      if (proof && mode !== "Online") {
        try {
          setUploading(true);
          receiptUrl = await uploadService.uploadAttachment(proof);
        } catch (error) {
          setProblem(
            error instanceof Error ? error.message : "The upload didn't work.",
          );
          return;
        } finally {
          setUploading(false);
        }
      }
      payout = {
        method: mode,
        receiptUrl,
        reference: reference.trim() || undefined,
      };
    }
    await onConfirm(isApprove ? undefined : reason, payout);
    setOpen(false);
    setReason("");
    setMode("Online");
    setProof(null);
    setReference("");
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger
        render={
          <Button
            type="button"
            variant={isApprove ? "default" : "outline"}
            size="sm"
            disabled={busy}
          />
        }
      >
        {busy ? (
          <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
        ) : isApprove ? (
          "Approve"
        ) : (
          "Decline"
        )}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            {isApprove ? "Approve" : "Decline"} {request.type.toLowerCase()}{" "}
            request
          </AlertDialogTitle>
          <AlertDialogDescription>
            {isApprove ? (
              <>
                This records a real {formatMoney(request.amount, currency)}{" "}
                {request.type === "Deposit"
                  ? "deposit into"
                  : "withdrawal from"}{" "}
                {request.memberName}&apos;s {request.savingsType}.
                {request.type === "Withdrawal" && request.netAmount != null ? (
                  <>
                    {" "}
                    {request.memberName} receives{" "}
                    {formatMoney(request.netAmount, currency)} after the{" "}
                    {request.feePercent}% withdrawal fee.
                  </>
                ) : null}{" "}
                This can&apos;t be undone from here.
              </>
            ) : (
              <>
                {request.memberName}&apos;s {request.type.toLowerCase()} request
                for {formatMoney(request.amount, currency)} will be marked
                declined. No savings record is created, and {request.memberName}{" "}
                is notified.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        {isApprove && request.type === "Withdrawal" ? (
          <div className="space-y-3">
            <p className="text-sm font-medium text-foreground">
              How is the money paid?
            </p>
            <div className="grid gap-2 sm:grid-cols-2" role="radiogroup">
              {PAYOUT_MODES.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  role="radio"
                  aria-checked={mode === option.value}
                  onClick={() => {
                    setMode(option.value);
                    setProblem(null);
                  }}
                  className={cn(
                    "rounded-xl border p-3 text-left transition-colors",
                    mode === option.value
                      ? "border-primary bg-primary/5 ring-1 ring-primary"
                      : "border-border hover:bg-muted/50",
                  )}
                >
                  <span className="block text-sm font-semibold text-foreground">
                    {option.title}
                  </span>
                  <span className="block text-xs text-muted-foreground">
                    {option.body}
                  </span>
                </button>
              ))}
            </div>
            {mode !== "Online" ? (
              <div className="grid gap-2 sm:grid-cols-2">
                <div className="space-y-1.5">
                  <Label htmlFor={`proof-${request.id}`}>
                    {mode === "Cheque" ? "Cheque photo" : "Receipt"}
                    {mode === "Cash" ? " (optional)" : ""}
                  </Label>
                  <Input
                    id={`proof-${request.id}`}
                    type="file"
                    accept="image/*,application/pdf"
                    onChange={(event) =>
                      setProof(event.target.files?.[0] ?? null)
                    }
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor={`ref-${request.id}`}>
                    {mode === "Cheque" ? "Cheque number" : "Reference"}{" "}
                    (optional)
                  </Label>
                  <Input
                    id={`ref-${request.id}`}
                    maxLength={100}
                    value={reference}
                    onChange={(event) => setReference(event.target.value)}
                  />
                </div>
              </div>
            ) : null}
            {problem ? (
              <p className="text-sm text-destructive">{problem}</p>
            ) : null}
          </div>
        ) : null}
        {isApprove ? null : (
          <div className="space-y-1.5">
            <Label htmlFor={`decline-reason-${request.id}`}>
              Reason (optional)
            </Label>
            <Textarea
              id={`decline-reason-${request.id}`}
              value={reason}
              maxLength={500}
              onChange={(event) => setReason(event.target.value)}
              placeholder="e.g. Your savings are committed to an active loan"
              rows={3}
            />
            <p className="text-xs text-muted-foreground">
              {request.memberName} sees this in their notification.
            </p>
          </div>
        )}
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isApprove ? "default" : "destructive"}
            disabled={busy || uploading}
            onClick={handleConfirm}
          >
            {isApprove ? "Approve" : "Decline"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
