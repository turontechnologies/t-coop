"use client";

import { useState } from "react";
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
import type { SavingsRequest } from "@/lib/coop-data";
import { formatNaira, formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SavingsRequestsTableProps {
  requests: SavingsRequest[];
  onResolve: (
    requestId: string,
    status: "Approved" | "Declined",
  ) => Promise<void> | void;
}

export function SavingsRequestsTable({
  requests,
  onResolve,
}: SavingsRequestsTableProps) {
  const [busyId, setBusyId] = useState<string | null>(null);

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
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">Member</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Type</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Savings Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Amount</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Requested
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Action</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((request) => {
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
                  {formatNaira(request.amount)}
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
                  {request.status === "Pending" ? (
                    <div className="flex items-center gap-2">
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
          })}
        </tbody>
      </table>
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
                This records a real {formatNaira(request.amount)}{" "}
                {request.type === "Deposit"
                  ? "deposit into"
                  : "withdrawal from"}{" "}
                {request.memberName}&apos;s {request.savingsType}. This
                can&apos;t be undone from here.
              </>
            ) : (
              <>
                {request.memberName}&apos;s {request.type.toLowerCase()} request
                for {formatNaira(request.amount)} will be marked declined. No
                savings record is created.
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
