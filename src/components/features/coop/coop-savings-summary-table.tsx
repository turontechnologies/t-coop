"use client";

import { useRouter } from "next/navigation";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { formatMoney } from "@/lib/format";

interface SavingsTypeSummary {
  name: string;
  min: number;
  max: number;
  earnings: number;
  total: number;
}

interface CoopSavingsSummaryTableProps {
  totalsByType: SavingsTypeSummary[];
  currency: string;
  /** Defaults to the super-admin co-operative oversight path. */
  basePath?: string;
  coopId: string;
}

export function CoopSavingsSummaryTable({
  totalsByType,
  currency,
  coopId,
  basePath = `/co-operatives/${coopId}/savings`,
}: CoopSavingsSummaryTableProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[680px] text-left text-sm">
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
                Earnings on Savings
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Total Savings &amp; Contributions
              </th>
            </tr>
          </thead>
          <tbody>
            {totalsByType.map((type) => (
              <tr
                key={type.name}
                onClick={() =>
                  router.push(`${basePath}/${encodeURIComponent(type.name)}`)
                }
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {type.name}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatMoney(type.min, currency)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatMoney(type.max, currency)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatMoney(type.earnings, currency)}
                </td>
                <td className="px-4 py-3 font-medium text-foreground">
                  {formatMoney(type.total, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={totalsByType.length === 0}
        emptyMessage="No savings types configured."
      >
        {totalsByType.map((type) => (
          <MobileRecordCard
            key={type.name}
            onClick={() =>
              router.push(`${basePath}/${encodeURIComponent(type.name)}`)
            }
            title={type.name}
            fields={[
              {
                label: "Minimum Savings",
                value: formatMoney(type.min, currency),
              },
              {
                label: "Maximum Savings",
                value: formatMoney(type.max, currency),
              },
              {
                label: "Earnings on Savings",
                value: formatMoney(type.earnings, currency),
              },
              {
                label: "Total Savings & Contributions",
                value: formatMoney(type.total, currency),
              },
            ]}
          />
        ))}
      </MobileRecordList>
    </div>
  );
}
