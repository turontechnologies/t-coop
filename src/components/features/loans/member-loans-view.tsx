"use client";

import { useMemo, useState } from "react";
import { Landmark } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { LoanRecordsTable } from "@/components/features/loans/loan-records-table";
import { LoanSuccessModal } from "@/components/features/loans/loan-success-modal";
import { TakeLoanModal } from "@/components/features/loans/take-loan-modal";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import {
  findLoanType,
  computeLoanTerms,
  type LoanRecord,
} from "@/lib/loans-data";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useLoansStore } from "@/store/loans.store";
import { useSavingsStore } from "@/store/savings.store";

const EXPORT_COLUMNS: ExportColumn<LoanRecord>[] = [
  { header: "Loan Type", accessor: (record) => record.loanType },
  { header: "Loan Amount", accessor: (record) => record.amount },
  {
    header: "No of Repayments",
    accessor: (record) => record.numberOfRepayments,
  },
  { header: "Repayment Amount", accessor: (record) => record.monthlyRepayment },
  { header: "Date", accessor: (record) => record.date },
  { header: "Status", accessor: (record) => record.status },
];

interface MemberLoansViewProps {
  memberId: string;
  memberName: string;
  heading?: string;
  /** Hide the "Quick Summary" heading, card, and "+ New Loan" button — for embedding inside a page that already renders its own summary and add action (e.g. the admin's "My Loans" tab). */
  showSummary?: boolean;
  /** Controls the Take Loan modal from outside, for use alongside `showSummary={false}`. Falls back to internal state when omitted. */
  takeOpen?: boolean;
  onTakeOpenChange?: (open: boolean) => void;
}

export function MemberLoansView({
  memberId,
  memberName,
  heading = "My Loan Record",
  showSummary = true,
  takeOpen: takeOpenProp,
  onTakeOpenChange,
}: MemberLoansViewProps) {
  const records = useLoansStore((state) => state.records);
  const addRecord = useLoansStore((state) => state.addRecord);
  const savingsRecords = useSavingsStore((state) => state.records);

  const memberRecords = useMemo(
    () => records.filter((record) => record.memberId === memberId),
    [records, memberId],
  );
  const totalSavings = useMemo(
    () =>
      savingsRecords
        .filter((record) => record.memberId === memberId)
        .reduce((sum, record) => sum + record.amount, 0),
    [savingsRecords, memberId],
  );
  const totalActive = useMemo(
    () =>
      memberRecords
        .filter(
          (record) =>
            record.status === "Active" || record.status === "Awaiting Approval",
        )
        .reduce((sum, record) => sum + record.amount, 0),
    [memberRecords],
  );

  const [internalTakeOpen, setInternalTakeOpen] = useState(false);
  const takeOpen = takeOpenProp ?? internalTakeOpen;
  const setTakeOpen = onTakeOpenChange ?? setInternalTakeOpen;
  const [busy, setBusy] = useState(false);
  const [successOpen, setSuccessOpen] = useState(false);
  const [lastAmount, setLastAmount] = useState(0);

  const handleProceed = async (
    loanType: string,
    amount: number,
    guarantorName: string,
  ) => {
    const type = findLoanType(loanType);
    if (!type) return;

    setBusy(true);
    const terms = computeLoanTerms(type, amount);
    await new Promise((resolve) => setTimeout(resolve, 1200));

    try {
      addRecord({
        id: `loan-${Date.now()}`,
        memberId,
        memberName,
        loanType,
        amount,
        interestRate: terms.interestRate,
        durationMonths: terms.durationMonths,
        numberOfRepayments: terms.numberOfRepayments,
        monthlyRepayment: terms.monthlyRepayment,
        totalRepayment: terms.totalRepayment,
        guarantorName,
        date: new Date().toISOString().slice(0, 10),
        status: "Awaiting Approval",
        repaymentsMade: 0,
      });
      setTakeOpen(false);
      setLastAmount(amount);
      setSuccessOpen(true);
    } catch (error) {
      toast.error("Couldn't submit loan application", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setBusy(false);
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
            <Button onClick={() => setTakeOpen(true)}>+ New Loan</Button>
          </div>

          <Card className="max-w-xs">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">Active Loans</p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatNaira(totalActive)}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <Landmark className="size-5" aria-hidden="true" />
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
              filenamePrefix={`loans-${memberId}`}
              exportTitle={`${memberName} — Loans`}
            />
          </div>
          <LoanRecordsTable records={memberRecords} />
        </CardContent>
      </Card>

      <TakeLoanModal
        open={takeOpen}
        onOpenChange={setTakeOpen}
        busy={busy}
        memberName={memberName}
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
