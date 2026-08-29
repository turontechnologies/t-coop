"use client";

import { useMemo, useState } from "react";
import { PiggyBank } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AddSavingsModal } from "@/components/features/savings/add-savings-modal";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { PaymentSuccessModal } from "@/components/features/savings/payment-success-modal";
import {
  RequestWithdrawalModal,
  type WithdrawalPayload,
} from "@/components/features/savings/request-withdrawal-modal";
import { SavingsRecordsTable } from "@/components/features/savings/savings-records-table";
import { openPaystackCheckout } from "@/lib/paystack";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import type { CoopSavingsRecord } from "@/lib/coop-data";
import { useCoopSavingsRecords } from "@/hooks/use-coop-savings";
import {
  useConfirmSavingsDeposit,
  useInitializeSavingsDeposit,
  useRequestWithdrawal,
} from "@/hooks/use-savings-self";
import type { ExportColumn } from "@/lib/table-export";

const EXPORT_COLUMNS: ExportColumn<CoopSavingsRecord>[] = [
  { header: "Savings Type", accessor: (record) => record.savingsType },
  { header: "Method", accessor: (record) => record.method },
  { header: "Savings Amount", accessor: (record) => record.amount },
  { header: "Date", accessor: (record) => record.date },
  { header: "Status", accessor: (record) => record.status },
];

interface MemberSavingsViewProps {
  coopId: string;
  memberId: string;
  memberName: string;
  memberEmail: string;
  heading?: string;
  /** Hide the "Quick Summary" heading, card, and "+ New Savings" button — for embedding inside a page that already renders its own summary and add action (e.g. the admin's "My Savings" tab). */
  showSummary?: boolean;
  /** Controls the Add Savings modal from outside, for use alongside `showSummary={false}`. Falls back to internal state when omitted. */
  addOpen?: boolean;
  onAddOpenChange?: (open: boolean) => void;
  /** Same idea as `addOpen`, for the Request Withdrawal modal. */
  withdrawOpen?: boolean;
  onWithdrawOpenChange?: (open: boolean) => void;
}

export function MemberSavingsView({
  coopId,
  memberId,
  memberName,
  memberEmail,
  heading = "My Savings Record",
  showSummary = true,
  addOpen: addOpenProp,
  onAddOpenChange,
  withdrawOpen: withdrawOpenProp,
  onWithdrawOpenChange,
}: MemberSavingsViewProps) {
  const currency = useCurrency();
  const { data: memberRecords = [] } = useCoopSavingsRecords(coopId, {
    memberId,
  });
  const total = useMemo(
    () => memberRecords.reduce((sum, record) => sum + record.amount, 0),
    [memberRecords],
  );

  const initializeDeposit = useInitializeSavingsDeposit(coopId);
  const confirmDeposit = useConfirmSavingsDeposit(coopId);
  const requestWithdrawal = useRequestWithdrawal(coopId);

  const [internalAddOpen, setInternalAddOpen] = useState(false);
  const addOpen = addOpenProp ?? internalAddOpen;
  const setAddOpen = onAddOpenChange ?? setInternalAddOpen;
  const [internalWithdrawOpen, setInternalWithdrawOpen] = useState(false);
  const withdrawOpen = withdrawOpenProp ?? internalWithdrawOpen;
  const setWithdrawOpen = onWithdrawOpenChange ?? setInternalWithdrawOpen;
  const [busy, setBusy] = useState(false);
  const [withdrawBusy, setWithdrawBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleProceed = async (savingsTypeId: string, amount: number) => {
    setBusy(true);
    try {
      const intent = await initializeDeposit.mutateAsync({
        savingsTypeId,
        amount,
      });
      await openPaystackCheckout({
        email: memberEmail,
        amountNaira: amount,
        reference: intent.reference,
        publicKey: intent.publicKey,
        onSuccess: async (reference) => {
          try {
            await confirmDeposit.mutateAsync(reference);
            setAddOpen(false);
            setLastAmount(amount);
            setSuccessOpen(true);
          } catch (error) {
            toast.error("Couldn't confirm payment", {
              description:
                error instanceof Error ? error.message : "Please try again.",
            });
          } finally {
            setBusy(false);
          }
        },
        onClose: () => setBusy(false),
      });
    } catch (error) {
      toast.error("Couldn't start payment", {
        description: error instanceof Error ? error.message : undefined,
      });
      setBusy(false);
    }
  };

  const handleRequestWithdrawal = async ({
    savingsTypeId,
    savingsTypeName,
    amount,
    note,
    netAmount,
  }: WithdrawalPayload) => {
    setWithdrawBusy(true);
    try {
      await requestWithdrawal.mutateAsync({
        savingsTypeId,
        amount,
        note: note || undefined,
      });
      setWithdrawOpen(false);
      toast.success("Withdrawal requested", {
        description: `Your request for ${formatMoney(amount, currency)} from ${savingsTypeName} is awaiting admin approval — you'll receive ${formatMoney(netAmount, currency)} after fees.`,
      });
    } catch (error) {
      toast.error("Couldn't submit withdrawal request", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setWithdrawBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      {showSummary ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Quick Summary
            </h2>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                onClick={() => setWithdrawOpen(true)}
                disabled={total <= 0}
              >
                Withdraw
              </Button>
              <Button onClick={() => setAddOpen(true)}>+ New Savings</Button>
            </div>
          </div>

          <Card className="max-w-xs">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">My Savings</p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatMoney(total, currency)}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PiggyBank className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>
        </>
      ) : null}

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">{heading}</h3>
            <ExportImportMenu
              rows={memberRecords}
              columns={EXPORT_COLUMNS}
              filenamePrefix={`savings-${memberId}`}
              exportTitle={`${memberName} — Savings & Contributions`}
              entityLabel="savings record"
            />
          </div>
          <SavingsRecordsTable records={memberRecords} />
        </CardContent>
      </Card>

      <AddSavingsModal
        open={addOpen}
        onOpenChange={setAddOpen}
        coopId={coopId}
        busy={busy}
        onProceed={handleProceed}
      />
      <PaymentSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        amount={lastAmount}
      />
      <RequestWithdrawalModal
        open={withdrawOpen}
        onOpenChange={setWithdrawOpen}
        coopId={coopId}
        busy={withdrawBusy}
        memberRecords={memberRecords}
        onProceed={handleRequestWithdrawal}
      />
    </div>
  );
}
