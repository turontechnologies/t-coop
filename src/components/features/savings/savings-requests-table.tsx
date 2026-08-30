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

interface SavingsRequestsTableProps {
  requests: SavingsRequest[];
  /** Hides the Approve/Decline actions for a read-only viewer — defaults to true so every
   * existing caller (which never restricts this) keeps working unchanged. */
  canResolve?: boolean;
  onResolve: (
    requestId: string,
    status: "Approved" | "Declined",
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
  ) => {
    setBusyId(requestId);
    await onResolve(requestId, status);
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
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Member
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Type</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Savings Type
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Amount
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Requested
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
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
                            onConfirm={() =>
                              handleResolve(request.id, "Approved")
                            }
                          />
                          <ConfirmResolveDialog
                            request={request}
                            status="Declined"
                            busy={busy}
                            onConfirm={() =>
                              handleResolve(request.id, "Declined")
                            }
                          />
                        </div>
                      ) : (
                        <span className="text-xs text-muted-foreground">
                          {request.resolvedAt
                            ? formatTimeAgo(request.resolvedAt)
                            : "—"}
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
                      onConfirm={() => handleResolve(request.id, "Approved")}
                    />
                    <ConfirmResolveDialog
                      request={request}
                      status="Declined"
                      busy={busy}
                      onConfirm={() => handleResolve(request.id, "Declined")}
                    />
                  </>
                ) : (
                  <span className="text-xs text-muted-foreground">
                    {request.resolvedAt
                      ? `Resolved ${formatTimeAgo(request.resolvedAt)}`
                      : "—"}
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
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const isApprove = status === "Approved";
  const currency = useCurrency();

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
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
                declined. No savings record is created.
              </>
            )}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            variant={isApprove ? "default" : "destructive"}
            disabled={busy}
            onClick={handleConfirm}
          >
            {isApprove ? "Approve" : "Decline"}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
