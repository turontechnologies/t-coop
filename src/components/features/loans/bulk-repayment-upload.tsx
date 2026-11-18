"use client";

import { Badge } from "@/components/ui/badge";
import type { ImportConfig } from "@/components/features/shared/export-import-menu";
import { useCoopLoanRecords } from "@/hooks/use-coop-loans";
import { useBulkRepayments } from "@/hooks/use-loan-repayments";
import {
  downloadBulkRepaymentTemplate,
  parseBulkRepaymentFile,
} from "@/lib/bulk-upload";
import { formatDateLong, formatMoney } from "@/lib/format";
import { formatMonths } from "@/lib/loan-progress";
import type {
  BulkRepaymentLine,
  BulkRepaymentRow,
} from "@/services/loan-repayment.service";

/**
 * Loan-repayment import for the shared Export / Import menu: one pre-filled row per active
 * loan; any amount up to what each member owes. Checked first, all or nothing.
 */
export function useBulkRepaymentImport(
  coopId: string,
  currency: string,
): ImportConfig<BulkRepaymentRow> {
  const { data: loans = [] } = useCoopLoanRecords(coopId);
  const bulk = useBulkRepayments(coopId);

  return {
    title: "Import loan repayments",
    description:
      "Record repayments for many loans at once, e.g. payroll deductions or transfers received. Any amount works: half a month, a month and a half, or the whole loan.",
    templateHint:
      "It's already filled in with every active loan. Just type what each member paid; rows left empty are skipped.",
    downloadTemplate: () => downloadBulkRepaymentTemplate(loans),
    parseFile: parseBulkRepaymentFile,
    submit: (rows, dryRun) => bulk.mutateAsync({ rows, dryRun }),
    formatTotal: (amount) => formatMoney(amount, currency),
    columns: [
      {
        header: "Member",
        cell: (line: BulkRepaymentLine) => (
          <>
            <span className="block font-medium">{line.memberName}</span>
            <span className="text-xs text-muted-foreground">
              {line.memberId} · {line.loanType}
            </span>
          </>
        ),
      },
      {
        header: "Covers",
        cell: (line: BulkRepaymentLine) => (
          <span className="inline-flex flex-wrap items-center gap-1.5">
            {formatMonths(line.monthsCovered)}
            {line.completesLoan ? (
              <Badge variant="secondary" className="bg-success/15 text-success">
                Clears loan
              </Badge>
            ) : (
              <span className="text-xs text-muted-foreground">
                {formatMoney(line.outstandingAfter, currency)} left
              </span>
            )}
          </span>
        ),
      },
      {
        header: "Date",
        cell: (line: BulkRepaymentLine) => formatDateLong(new Date(line.date)),
      },
      {
        header: "Amount",
        align: "right",
        cell: (line: BulkRepaymentLine) => formatMoney(line.amount, currency),
      },
    ],
  };
}
