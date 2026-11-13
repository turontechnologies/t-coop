"use client";

import { useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoanRecordsTable } from "@/components/features/loans/loan-records-table";
import {
  LOAN_SLICE_LABELS,
  LoanStatusCards,
  loansInSlice,
  type LoanSlice,
} from "@/components/features/loans/loan-status-cards";
import { LoanSuccessModal } from "@/components/features/loans/loan-success-modal";
import { TakeLoanModal } from "@/components/features/loans/take-loan-modal";
import { ChooseLoanTypeDialog } from "@/components/features/loans/choose-loan-type-dialog";
import { CheckoutDialog } from "@/components/features/payments/checkout-dialog";
import { useLoanFeePayment, useLoanFeeStatus } from "@/hooks/use-loan-fee";
import { useAuthStore } from "@/store/auth.store";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import {
  type CoopLoanRecord,
  loanStatusLabel,
  totalSaved,
} from "@/lib/coop-data";
import { useCoopLoanRecords } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCoopSavingsRecords } from "@/hooks/use-coop-savings";
import { useApplyForLoan, useLoansAwaitingMe } from "@/hooks/use-loans-self";
import { LoansAwaitingMeCard } from "@/components/features/loans/loans-awaiting-me-card";
import type { LoanApplicationPayload } from "@/services/loan-self.service";
import { useCurrency } from "@/components/providers/currency-provider";
import type { ExportColumn } from "@/lib/table-export";

const EXPORT_COLUMNS: ExportColumn<CoopLoanRecord>[] = [
  { header: "Loan Type", accessor: (record) => record.loanType },
  { header: "Loan Amount", accessor: (record) => record.amount },
  {
    header: "No of Repayments",
    accessor: (record) => record.numberOfRepayments,
  },
  { header: "Repayment Amount", accessor: (record) => record.monthlyRepayment },
  { header: "Date", accessor: (record) => record.date },
  { header: "Status", accessor: (record) => loanStatusLabel(record) },
];

interface MemberLoansViewProps {
  coopId: string;
  memberId: string;
  memberName: string;
  heading?: string;
  /** Hide the "Quick Summary" heading, card, and "+ New Loan" button — for embedding inside a page that already renders its own summary and add action (e.g. the admin's "My Loans" tab). */
  showSummary?: boolean;
  /** Controls the Take Loan modal from outside, for use alongside `showSummary={false}`. Falls back to internal state when omitted. */
  takeOpen?: boolean;
  onTakeOpenChange?: (open: boolean) => void;
  /** Passed only from the admin's own-loans tab; member views never receive import access. */
}

export function MemberLoansView({
  coopId,
  memberId,
  memberName,
  heading = "My Loan Record",
  showSummary = true,
  takeOpen: takeOpenProp,
  onTakeOpenChange,
}: MemberLoansViewProps) {
  const { data: memberRecords = [] } = useCoopLoanRecords(coopId, {
    memberId,
  });
  const { data: savingsRecords = [] } = useCoopSavingsRecords(coopId, {
    memberId,
  });
  const { data: members = [] } = useCoopMembers(coopId);
  const applyForLoan = useApplyForLoan(coopId);
  const currency = useCurrency();
  const email = useAuthStore((state) => state.member?.email) ?? "";

  const totalSavings = useMemo(
    () => totalSaved(savingsRecords),
    [savingsRecords],
  );
  // memberRecords also includes loans this member only guarantees (see LoanController's
  // records() filter); the cards count the loans they borrowed, so a guarantee doesn't inflate
  // their own figures.
  const myOwnLoans = useMemo(
    () => memberRecords.filter((record) => record.memberId === memberId),
    [memberRecords, memberId],
  );
  const [slice, setSlice] = useState<LoanSlice | null>(null);
  const shownRecords = slice ? loansInSlice(myOwnLoans, slice) : memberRecords;

  const [internalTakeOpen, setInternalTakeOpen] = useState(false);
  const takeOpen = takeOpenProp ?? internalTakeOpen;
  const setTakeOpen = onTakeOpenChange ?? setInternalTakeOpen;
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);

  // The application fee (set by the admin) is paid before the form opens. A paid fee waits on
  // file until it's used, so closing the form doesn't mean paying again.
  const { data: feeStatus, refetch: refetchFee } = useLoanFeeStatus(
    coopId,
    takeOpen,
  );
  // With a fee per loan type, the member picks the type first, then pays that type's fee.
  const perType = feeStatus?.mode === "PerType";
  const [chosenTypeId, setChosenTypeId] = useState<string | null>(null);
  useEffect(() => {
    if (!takeOpen) setChosenTypeId(null);
  }, [takeOpen]);
  const chosenType = perType
    ? feeStatus?.types.find((type) => type.loanTypeId === chosenTypeId)
    : undefined;
  const payFee = useLoanFeePayment(coopId, email, chosenType?.loanTypeId);
  const feeAmount = perType ? (chosenType?.fee ?? 0) : (feeStatus?.fee ?? 0);
  const feeCredit = perType
    ? (chosenType?.credit ?? null)
    : (feeStatus?.credit ?? null);
  const choosingType = takeOpen && perType && !chosenType;
  const feeDue = !!feeStatus && !choosingType && feeAmount > 0 && !feeCredit;
  const formReady = takeOpen && !!feeStatus && !choosingType && !feeDue;
  const [lastAmount, setLastAmount] = useState(0);

  const handleProceed = async (application: LoanApplicationPayload) => {
    const { amount } = application;
    setBusy(true);
    try {
      await applyForLoan.mutateAsync(application);
      void refetchFee();
      setTakeOpen(false);
      setLastAmount(amount);
      setSuccessOpen(true);
    } catch (error) {
      toast.error("Couldn't submit loan application", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  const { data: awaitingMe = [] } = useLoansAwaitingMe(coopId);

  return (
    <div className="space-y-6">
      {awaitingMe.length > 0 ? (
        <LoansAwaitingMeCard loans={awaitingMe} currency={currency} />
      ) : null}
      {showSummary ? (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-foreground">
              Quick Summary
            </h2>
            <Button onClick={() => setTakeOpen(true)}>+ New Loan</Button>
          </div>

          <LoanStatusCards
            records={myOwnLoans}
            currency={currency}
            scope="member"
            active={slice}
            onSelect={setSlice}
          />
        </>
      ) : null}

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              {heading}
              {slice ? (
                <button
                  type="button"
                  onClick={() => setSlice(null)}
                  className="ml-2 rounded-full bg-primary/10 px-2.5 py-0.5 text-xs font-semibold text-primary hover:bg-primary/15 dark:text-emerald-300"
                >
                  {LOAN_SLICE_LABELS[slice]} · Clear
                </button>
              ) : null}
            </h3>
            <ExportImportMenu
              rows={memberRecords}
              columns={EXPORT_COLUMNS}
              filenamePrefix={`loans-${memberId}`}
              exportTitle={`${memberName} — Loans`}
            />
          </div>
          <LoanRecordsTable records={shownRecords} viewerId={memberId} />
        </CardContent>
      </Card>

      <ChooseLoanTypeDialog
        open={choosingType}
        onOpenChange={(next) => {
          if (!next) setTakeOpen(false);
        }}
        types={feeStatus?.types ?? []}
        currency={currency}
        onChoose={setChosenTypeId}
      />
      <CheckoutDialog
        open={takeOpen && feeDue}
        onOpenChange={(next) => {
          if (!next) {
            // Back to the loan types when fees differ by type; otherwise close.
            if (perType) setChosenTypeId(null);
            else setTakeOpen(false);
          }
        }}
        merchant={feeStatus?.merchantName ?? "Your co-operative"}
        label={
          chosenType
            ? `${chosenType.loanTypeName} application fee`
            : "Loan application fee"
        }
        email={email}
        amount={feeAmount}
        currency={currency}
        onPay={payFee}
        onDone={() => void refetchFee()}
      />
      <TakeLoanModal
        open={formReady}
        feeCredit={feeCredit}
        lockedLoanTypeId={chosenType?.loanTypeId}
        onOpenChange={setTakeOpen}
        coopId={coopId}
        busy={busy}
        memberId={memberId}
        members={members}
        totalSavings={totalSavings}
        onProceed={handleProceed}
      />
      <LoanSuccessModal
        open={successOpen}
        onOpenChange={setSuccessOpen}
        amount={lastAmount}
      />
    </div>
  );
}
