"use client";

import { Badge } from "@/components/ui/badge";
import { BulkUploadDialog } from "@/components/features/shared/bulk-upload-dialog";
import { useCoopLoanRecords } from "@/hooks/use-coop-loans";
import { useBulkRepayments } from "@/hooks/use-loan-repayments";
import {
  downloadBulkRepaymentTemplate,
  parseBulkRepaymentFile,
} from "@/lib/bulk-upload";
import { formatDateLong, formatMoney } from "@/lib/format";
import type {
  BulkRepaymentLine,
  BulkRepaymentRow,
} from "@/services/loan-repayment.service";

/** Loans → Bulk upload repayments: one pre-filled row per active loan; type what each paid. */
export function BulkRepaymentUploadDialog({
  coopId,
  currency,
  open,
  onOpenChange,
}: {
  coopId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: loans = [] } = useCoopLoanRecords(coopId);
  const bulk = useBulkRepayments(coopId);

  return (
    <BulkUploadDialog<BulkRepaymentRow, BulkRepaymentLine>
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk upload loan repayments"
      description="Record repayments for many loans at once, e.g. payroll deductions or transfers received. Each amount must be a whole number of installments."
      noun="repayment"
      downloadTemplate={() => downloadBulkRepaymentTemplate(loans)}
      parseFile={parseBulkRepaymentFile}
      submit={(rows, dryRun) => bulk.mutateAsync({ rows, dryRun })}
      formatTotal={(amount) => formatMoney(amount, currency)}
      columns={[
        {
          header: "Member",
          cell: (line) => (
            <>
              <span className="block font-medium">{line.memberName}</span>
              <span className="text-xs text-muted-foreground">
                {line.memberId} · {line.loanType}
              </span>
            </>
          ),
        },
        {
          header: "Installments",
          cell: (line) => (
            <span className="inline-flex flex-wrap items-center gap-1.5">
              {line.installments === 1
                ? `No. ${line.fromInstallment}`
                : `No. ${line.fromInstallment}–${line.fromInstallment + line.installments - 1}`}{" "}
              <span className="text-xs text-muted-foreground">
                of {line.totalInstallments}
              </span>
              {line.completesLoan ? (
                <Badge
                  variant="secondary"
                  className="bg-success/15 text-success"
                >
                  Clears loan
                </Badge>
              ) : null}
            </span>
          ),
        },
        {
          header: "Date",
          cell: (line) => formatDateLong(new Date(line.date)),
        },
        {
          header: "Amount",
          align: "right",
          cell: (line) => formatMoney(line.amount, currency),
        },
      ]}
    />
  );
}
