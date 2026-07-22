"use client";

import { useRouter } from "next/navigation";
import { coopSavingsBySummaryType, type Cooperative } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";

interface CoopSavingsSummaryTableProps {
  coop: Cooperative;
  /** Defaults to the super-admin co-operative oversight path. */
  basePath?: string;
}

export function CoopSavingsSummaryTable({
  coop,
  basePath = `/co-operatives/${coop.id}/savings`,
}: CoopSavingsSummaryTableProps) {
  const router = useRouter();
  const totalsByType = coopSavingsBySummaryType(coop);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
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
                {formatNaira(type.min)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatNaira(type.max)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatNaira(type.earnings)}
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {formatNaira(type.total)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
