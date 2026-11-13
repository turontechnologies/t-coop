"use client";

import { useGatewayCheckout } from "@/components/features/payments/use-gateway-checkout";
import { useCooperativeBranding } from "@/hooks/use-cooperative";

import { useEffect, useId, useMemo, useRef, useState } from "react";
import {
  FileText,
  Loader2,
  Receipt,
  TriangleAlert,
  Upload,
  X,
} from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { uploadService } from "@/services/upload.service";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import type { CoopLoanRecord } from "@/lib/coop-data";
import {
  useConfirmRepayment,
  useInitializeRepayment,
  useLoanRepayments,
  useManualRepayment,
  useNextInstallment,
} from "@/hooks/use-loan-repayments";
import {
  generateRepaymentSchedule,
  type RepaymentStatus,
} from "@/lib/loans-data";
import { formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function repaymentBadgeVariant(status: RepaymentStatus) {
  if (status === "Paid") return "secondary";
  if (status === "Upcoming" || status === "Pending") return "outline";
  return "destructive";
}

interface LoanRepaymentPanelProps {
  coopId: string;
  record: CoopLoanRecord;
  currency: string;
  /** The viewer is this loan's own borrower — shows a real Paystack "Make a Repayment" button. */
  canPay: boolean;
  /** The viewer is admin/coop-staff of this loan's co-op — shows "Record Repayment" for a
   * payment received offline. Ignored when `canPay` is also true (the borrower's own Paystack
   * flow takes priority over admin manual entry for their own loan). */
  canRecordManually: boolean;
  memberEmail?: string;
}

export function LoanRepaymentPanel({
  coopId,
  record,
  currency,
  canPay,
  canRecordManually,
  memberEmail,
}: LoanRepaymentPanelProps) {
  const schedule = useMemo(() => generateRepaymentSchedule(record), [record]);
  const { data: repayments = [], isLoading: repaymentsLoading } =
    useLoanRepayments(coopId, record.id);

  const isActive = record.status === "Active";
  const showPayButton = isActive && canPay;
  const showManualButton = isActive && !canPay && canRecordManually;

  const [payBusy, setPayBusy] = useState(false);
  const initializeRepayment = useInitializeRepayment(coopId, record.id);
  const confirmRepayment = useConfirmRepayment(coopId, record.id);
  const manualRepayment = useManualRepayment(coopId, record.id);

  const checkout = useGatewayCheckout();
  const { data: branding } = useCooperativeBranding(coopId);
  const nextDue =
    schedule.find((item) => item.status !== "Paid")?.totalAmount ??
    record.monthlyRepayment;

  const handlePay = () => {
    if (!memberEmail) return;
    let installment = record.repaymentsMade + 1;
    let paid = 0;
    setPayBusy(true);
    checkout.start({
      merchant: branding?.name ?? "Your co-operative",
      label: "Loan repayment",
      email: memberEmail,
      amount: nextDue,
      currency,
      initialize: async () => {
        const intent = await initializeRepayment.mutateAsync();
        installment = intent.installmentNumber;
        paid = intent.amount;
        return intent;
      },
      confirm: (reference) => confirmRepayment.mutateAsync(reference),
      onComplete: () => {
        setPayBusy(false);
        toast.success("Repayment recorded", {
          description: `Installment ${installment} of ${record.numberOfRepayments} — ${formatMoney(paid, currency)}.`,
        });
      },
      onCancel: () => setPayBusy(false),
    });
  };

  const handleRecordManually = async (proof: {
    receiptUrl: string;
    note?: string;
  }) => {
    const result = await manualRepayment.mutateAsync(proof);
    toast.success("Repayment recorded", {
      description: `Installment ${result.repayment.installmentNumber} of ${record.numberOfRepayments} — ${formatMoney(result.repayment.amount, currency)}. Receipt attached.`,
    });
  };

  return (
    <Card>
      <CardContent>
        <Tabs defaultValue="schedule">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <TabsList>
              <TabsTab value="schedule">Repayment Schedule</TabsTab>
              <TabsTab value="transactions">Transactions</TabsTab>
              <TabsIndicator />
            </TabsList>
            {showPayButton ? (
              <Button
                type="button"
                size="sm"
                disabled={payBusy}
                onClick={handlePay}
              >
                {payBusy ? (
                  <Loader2
                    className="size-3.5 animate-spin"
                    aria-hidden="true"
                  />
                ) : (
                  "Make a Repayment"
                )}
              </Button>
            ) : showManualButton ? (
              <RecordRepaymentDialog
                coopId={coopId}
                loanId={record.id}
                currency={currency}
                busy={manualRepayment.isPending}
                onConfirm={handleRecordManually}
              />
            ) : null}
          </div>

          <TabsPanel value="schedule">
            <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
              <table className="w-full min-w-[640px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Interest
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Total Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Due Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.map((item) => (
                    <tr
                      key={item.installment}
                      className="border-b border-border last:border-0"
                    >
                      <td className="px-4 py-3 text-foreground">
                        {formatMoney(item.amount, currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatMoney(item.interest, currency)}
                      </td>
                      <td className="px-4 py-3 font-medium text-foreground">
                        {formatMoney(item.totalAmount, currency)}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground">
                        {formatDateLong(new Date(item.dueDate))}
                      </td>
                      <td className="px-4 py-3">
                        <Badge
                          variant={repaymentBadgeVariant(item.status)}
                          className={cn(
                            item.status === "Paid" &&
                              "bg-success/15 text-success",
                          )}
                        >
                          {item.status}
                        </Badge>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <MobileRecordList
              isEmpty={schedule.length === 0}
              emptyMessage="No repayment schedule yet."
            >
              {schedule.map((item) => (
                <MobileRecordCard
                  key={item.installment}
                  title={`Installment ${item.installment}`}
                  badge={
                    <Badge
                      variant={repaymentBadgeVariant(item.status)}
                      className={cn(
                        item.status === "Paid" && "bg-success/15 text-success",
                      )}
                    >
                      {item.status}
                    </Badge>
                  }
                  fields={[
                    {
                      label: "Amount",
                      value: formatMoney(item.amount, currency),
                    },
                    {
                      label: "Interest",
                      value: formatMoney(item.interest, currency),
                    },
                    {
                      label: "Total Amount",
                      value: formatMoney(item.totalAmount, currency),
                    },
                    {
                      label: "Due Date",
                      value: formatDateLong(new Date(item.dueDate)),
                    },
                  ]}
                />
              ))}
            </MobileRecordList>
          </TabsPanel>

          <TabsPanel value="transactions">
            <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
              <table className="w-full min-w-[560px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Transaction ID
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Amount
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Date
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Method
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Receipt
                    </th>
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!repaymentsLoading && repayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No repayment transactions yet.
                      </td>
                    </tr>
                  ) : (
                    repayments.map((transaction) => (
                      <tr
                        key={transaction.id}
                        className="border-b border-border last:border-0"
                      >
                        <td className="px-4 py-3 font-medium text-foreground">
                          {transaction.transactionId}
                        </td>
                        <td className="px-4 py-3 text-foreground">
                          {formatMoney(transaction.amount, currency)}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {formatDateLong(new Date(transaction.date))}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          {transaction.method}
                          {transaction.recordedByName ? (
                            <span className="block text-xs">
                              by {transaction.recordedByName}
                            </span>
                          ) : null}
                        </td>
                        <td className="px-4 py-3">
                          <ReceiptLink url={transaction.receiptUrl} />
                        </td>
                        <td className="px-4 py-3">
                          <Badge
                            variant="secondary"
                            className="bg-success/15 text-success"
                          >
                            {transaction.status}
                          </Badge>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <MobileRecordList
              isEmpty={!repaymentsLoading && repayments.length === 0}
              emptyMessage="No repayment transactions yet."
            >
              {repayments.map((transaction) => (
                <MobileRecordCard
                  key={transaction.id}
                  title={transaction.transactionId}
                  badge={
                    <Badge
                      variant="secondary"
                      className="bg-success/15 text-success"
                    >
                      {transaction.status}
                    </Badge>
                  }
                  fields={[
                    {
                      label: "Amount",
                      value: formatMoney(transaction.amount, currency),
                    },
                    {
                      label: "Date",
                      value: formatDateLong(new Date(transaction.date)),
                    },
                    { label: "Method", value: transaction.method },
                    ...(transaction.receiptUrl
                      ? [
                          {
                            label: "Receipt",
                            value: <ReceiptLink url={transaction.receiptUrl} />,
                          },
                        ]
                      : []),
                  ]}
                />
              ))}
            </MobileRecordList>
          </TabsPanel>
        </Tabs>
      </CardContent>
      {checkout.dialog}
    </Card>
  );
}

function ReceiptLink({ url }: { url?: string | null }) {
  if (!url) return <span className="text-muted-foreground">—</span>;
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      onClick={(event) => event.stopPropagation()}
      className="inline-flex items-center gap-1 text-sm font-medium text-primary hover:underline"
    >
      <Receipt className="size-3.5" aria-hidden="true" />
      View receipt
    </a>
  );
}

const MAX_RECEIPT_BYTES = 5 * 1024 * 1024;

/**
 * Record a payment received offline (cash or bank transfer). The receipt is required — a photo
 * or PDF scan — so every hand-recorded repayment has proof attached.
 */
function RecordRepaymentDialog({
  coopId,
  loanId,
  currency,
  busy,
  onConfirm,
}: {
  coopId: string;
  loanId: string;
  currency: string;
  busy: boolean;
  onConfirm: (proof: { receiptUrl: string; note?: string }) => Promise<void>;
}) {
  const [open, setOpen] = useState(false);
  const { data: next } = useNextInstallment(coopId, loanId, open);
  const [receipt, setReceipt] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [problem, setProblem] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const noteId = useId();

  useEffect(() => {
    if (!open) {
      setReceipt(null);
      setPreview(null);
      setNote("");
      setProblem(null);
    }
  }, [open]);
  useEffect(
    () => () => {
      if (preview) URL.revokeObjectURL(preview);
    },
    [preview],
  );

  const takeReceipt = (file: File | undefined) => {
    setProblem(null);
    if (!file) return;
    if (!/^image\//.test(file.type) && !/\.pdf$/i.test(file.name)) {
      setProblem("Upload a photo (JPG or PNG) or a PDF of the receipt.");
      return;
    }
    if (file.size > MAX_RECEIPT_BYTES) {
      setProblem("That file is over 5 MB. Try a smaller photo.");
      return;
    }
    setReceipt(file);
    setPreview(/^image\//.test(file.type) ? URL.createObjectURL(file) : null);
  };

  const working = busy || uploading;

  const submit = async () => {
    setProblem(null);
    if (!receipt) {
      setProblem("Upload the receipt for this payment before recording it.");
      return;
    }
    try {
      setUploading(true);
      const receiptUrl = await uploadService.uploadAttachment(receipt);
      setUploading(false);
      await onConfirm({ receiptUrl, note: note.trim() || undefined });
      setOpen(false);
    } catch (error) {
      setProblem(
        error instanceof Error
          ? error.message
          : "Couldn't record the repayment.",
      );
    } finally {
      setUploading(false);
    }
  };

  return (
    <>
      <Button type="button" size="sm" onClick={() => setOpen(true)}>
        Record Repayment
      </Button>
      <Dialog open={open} onOpenChange={(value) => !working && setOpen(value)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Record a repayment</DialogTitle>
            <DialogDescription>
              For a payment received offline (cash or bank transfer). Attach the
              receipt as proof.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between rounded-xl border border-border bg-muted/40 px-4 py-3">
              <div>
                <p className="text-xs text-muted-foreground">
                  {next
                    ? `Installment ${next.installmentNumber}`
                    : "Next installment"}
                </p>
                <p className="text-lg font-semibold text-foreground">
                  {next ? formatMoney(next.amount, currency) : "…"}
                </p>
              </div>
              <Receipt
                className="size-6 text-muted-foreground"
                aria-hidden="true"
              />
            </div>

            <div className="space-y-2">
              <Label>Receipt</Label>
              <input
                ref={inputRef}
                type="file"
                accept="image/*,application/pdf"
                className="sr-only"
                aria-label="Upload receipt"
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
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium text-foreground">
                      {receipt.name}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {(receipt.size / 1024).toFixed(0)} KB
                    </p>
                  </div>
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
                    Upload the receipt
                  </span>
                  <span className="text-xs text-muted-foreground">
                    Photo or PDF, up to 5 MB
                  </span>
                </button>
              )}
            </div>

            <div className="space-y-2">
              <Label htmlFor={noteId}>Note (optional)</Label>
              <Textarea
                id={noteId}
                value={note}
                maxLength={500}
                onChange={(event) => setNote(event.target.value)}
                placeholder="e.g. Paid in cash at the office, bank transfer ref…"
                disabled={working}
                rows={2}
              />
            </div>

            {problem ? (
              <p
                role="alert"
                className="flex items-center gap-1.5 text-sm text-destructive"
              >
                <TriangleAlert
                  className="size-3.5 shrink-0"
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="button" disabled={working || !next} onClick={submit}>
              {working ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  {uploading ? "Uploading…" : "Recording…"}
                </>
              ) : (
                "Record repayment"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
