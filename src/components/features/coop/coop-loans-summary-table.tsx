"use client";

import { useRouter } from "next/navigation";
import { coopLoansBySummaryType, type Cooperative } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";

interface CoopLoansSummaryTableProps {
  coop: Cooperative;
  /** Defaults to the super-admin co-operative oversight path. */
  basePath?: string;
}

export function CoopLoansSummaryTable({
  coop,
  basePath = `/co-operatives/${coop.id}/loans`,
}: CoopLoansSummaryTableProps) {
  const router = useRouter();
  const totalsByType = coopLoansBySummaryType(coop);

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Eligibility %
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Duration
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              No of Repayments
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Interest
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Earnings on Loan
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
                {type.eligibilityPercent}%
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {type.durationMonths} Months
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {type.numberOfRepayments}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {type.interestRate}%
              </td>
              <td className="px-4 py-3 font-medium text-foreground">
                {formatNaira(type.earnings)}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
