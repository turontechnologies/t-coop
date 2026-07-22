"use client";

import { useMemo } from "react";
import { Wallet } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { SAVINGS_TYPES, type SavingsTypeDef } from "@/lib/savings-data";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import { useSavingsStore } from "@/store/savings.store";

interface SavingsTypeTotal extends SavingsTypeDef {
  total: number;
}

const EXPORT_COLUMNS: ExportColumn<SavingsTypeTotal>[] = [
  { header: "Savings Type", accessor: (type) => type.name },
  { header: "Minimum Savings", accessor: (type) => type.min },
  { header: "Maximum Savings", accessor: (type) => type.max },
  { header: "Total Savings & Contributions", accessor: (type) => type.total },
];

export function MembersSavingsOverview() {
  const records = useSavingsStore((state) => state.records);

  const totalsByType = useMemo(
    () =>
      SAVINGS_TYPES.map((type) => ({
        ...type,
        total: records
          .filter((record) => record.savingsType === type.name)
          .reduce((sum, record) => sum + record.amount, 0),
      })),
    [records],
  );

  const grandTotal = totalsByType.reduce((sum, type) => sum + type.total, 0);

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>

      <Card className="max-w-xs">
        <CardContent className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <p className="text-sm text-muted-foreground">Total Savings</p>
            <p className="text-xl font-semibold text-foreground sm:text-2xl">
              {formatNaira(grandTotal)}
            </p>
          </div>
          <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
            <Wallet className="size-5" aria-hidden="true" />
          </span>
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h3 className="text-sm font-semibold text-foreground">
              Members Savings
            </h3>
            <ExportImportMenu
              rows={totalsByType}
              columns={EXPORT_COLUMNS}
              filenamePrefix="members-savings-overview"
              exportTitle="Members Savings Overview"
            />
          </div>

          <div className="overflow-x-auto rounded-xl border border-border">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-accent/60">
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Savings Type
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Minimum Savings
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Maximum Savings
                  </th>
                  <th className="px-4 py-2.5 font-medium text-foreground">
                    Total Savings & Contributions
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
                      {formatNaira(type.min)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNaira(type.max)}
                    </td>
                    <td className="px-4 py-3 font-medium text-foreground">
                      {formatNaira(type.total)}
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
