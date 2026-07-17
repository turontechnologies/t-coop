"use client";

import { useMemo } from "react";
import { Landmark } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ExportImportMenu } from "@/components/features/savings/export-import-menu";
import { LOAN_TYPES, type LoanTypeDef } from "@/lib/loans-data";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useLoansStore } from "@/store/loans.store";

interface LoanTypeTotal extends LoanTypeDef {
  totalDisbursed: number;
  activeCount: number;
}

const EXPORT_COLUMNS: ExportColumn<LoanTypeTotal>[] = [
  { header: "Loan Type", accessor: (type) => type.name },
  { header: "Interest Rate", accessor: (type) => `${type.interestRate}%` },
  { header: "Max Amount", accessor: (type) => type.maxAmount },
  { header: "Total Disbursed", accessor: (type) => type.totalDisbursed },
  { header: "Active Loans", accessor: (type) => type.activeCount },
];

export function MembersLoansOverview() {
  const records = useLoansStore((state) => state.records);

  const totalsByType = useMemo(
    () =>
      LOAN_TYPES.map((type) => {
        const forType = records.filter(
          (record) => record.loanType === type.name,
        );
        return {
          ...type,
          totalDisbursed: forType
            .filter((record) => record.status !== "Rejected")
            .reduce((sum, record) => sum + record.amount, 0),
          activeCount: forType.filter((record) => record.status === "Active")
            .length,
        };
      }),
    [records],
  );

  const grandTotal = totalsByType.reduce(
    (sum, type) => sum + type.totalDisbursed,
    0,
  );

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>

      <Card className="max-w-xs">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">
              Total Loans Disbursed
            </p>
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              {formatNaira(grandTotal)}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Landmark className="size-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Members Loans
            </h3>
            <ExportImportMenu
              rows={totalsByType}
              columns={EXPORT_COLUMNS}
              filenamePrefix="members-loans-overview"
              exportTitle="Members Loans Overview"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[640px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/60">
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Loan Type
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Interest Rate
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Max Amount
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Total Disbursed
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Active Loans
                  </th>
                </tr>
              </thead>
              <tbody>
                {totalsByType.map((type) => (
                  <tr
                    key={type.name}
                    className="border-b border-border last:border-0"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {type.name}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {type.interestRate}%
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNaira(type.maxAmount)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatNaira(type.totalDisbursed)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {type.activeCount}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
