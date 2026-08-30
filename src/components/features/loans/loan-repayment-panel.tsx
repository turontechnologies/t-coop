"use client";

import { useMemo, useState } from "react";
import { Loader2 } from "lucide-react";
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
import { openPaystackCheckout } from "@/lib/paystack";
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

  const handlePay = async () => {
    if (!memberEmail) return;
    setPayBusy(true);
    try {
      const intent = await initializeRepayment.mutateAsync();
      await openPaystackCheckout({
        email: memberEmail,
        amountNaira: intent.amount,
        reference: intent.reference,
        publicKey: intent.publicKey,
        onSuccess: async (reference) => {
          try {
            await confirmRepayment.mutateAsync(reference);
            toast.success("Repayment recorded", {
              description: `Installment ${intent.installmentNumber} of ${record.numberOfRepayments} — ${formatMoney(intent.amount, currency)}.`,
            });
          } catch (error) {
            toast.error("Couldn't confirm payment", {
              description:
                error instanceof Error ? error.message : "Please try again.",
            });
          } finally {
            setPayBusy(false);
          }
        },
        onClose: () => setPayBusy(false),
      });
    } catch (error) {
      toast.error("Couldn't start payment", {
        description: error instanceof Error ? error.message : undefined,
      });
      setPayBusy(false);
    }
  };

  const handleRecordManually = async () => {
    try {
      const result = await manualRepayment.mutateAsync();
      toast.success("Repayment recorded", {
        description: `Installment ${result.repayment.installmentNumber} of ${record.numberOfRepayments} — ${formatMoney(result.repayment.amount, currency)}.`,
      });
    } catch (error) {
      toast.error("Couldn't record repayment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
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
                  <tr className="border-b border-border bg-accent/60">
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Interest
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Total Amount
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Due Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
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
                  <tr className="border-b border-border bg-accent/60">
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Transaction ID
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Amount
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Date
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Method
                    </th>
                    <th className="px-4 py-2.5 font-medium text-foreground">
                      Status
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {!repaymentsLoading && repayments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
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
                  ]}
                />
              ))}
            </MobileRecordList>
          </TabsPanel>
        </Tabs>
      </CardContent>
    </Card>
  );
}

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
  onConfirm: () => Promise<void> | void;
}) {
  const [open, setOpen] = useState(false);
  const { data: next } = useNextInstallment(coopId, loanId, open);

  const handleConfirm = async () => {
    await onConfirm();
    setOpen(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={setOpen}>
      <AlertDialogTrigger render={<Button type="button" size="sm" />}>
        Record Repayment
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Record a repayment</AlertDialogTitle>
          <AlertDialogDescription>
            {next
              ? `This records installment ${next.installmentNumber} — ${formatMoney(next.amount, currency)} — as received offline (cash/bank transfer). This can't be undone from here.`
              : "Loading the next installment amount…"}
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy || !next} onClick={handleConfirm}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Record"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
