"use client";

import { useRouter } from "next/navigation";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { formatMoney } from "@/lib/format";

interface LoanTypeSummary {
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
  numberOfRepayments: number;
  interestRate: number;
  earnings: number;
}

interface CoopLoansSummaryTableProps {
  totalsByType: LoanTypeSummary[];
  currency: string;
  coopId: string;
  /** Defaults to the super-admin co-operative oversight path. */
  basePath?: string;
}

export function CoopLoansSummaryTable({
  totalsByType,
  currency,
  coopId,
  basePath = `/co-operatives/${coopId}/loans`,
}: CoopLoansSummaryTableProps) {
  const router = useRouter();

  return (
    <div className="space-y-4">
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
                  {formatMoney(type.earnings, currency)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={totalsByType.length === 0}
        emptyMessage="No loan types configured."
      >
        {totalsByType.map((type) => (
          <MobileRecordCard
            key={type.name}
            onClick={() =>
              router.push(`${basePath}/${encodeURIComponent(type.name)}`)
            }
            title={type.name}
            fields={[
              { label: "Eligibility %", value: `${type.eligibilityPercent}%` },
              {
                label: "Loan Duration",
                value: `${type.durationMonths} Months`,
              },
              { label: "No of Repayments", value: type.numberOfRepayments },
              { label: "Interest", value: `${type.interestRate}%` },
              {
                label: "Earnings on Loan",
                value: formatMoney(type.earnings, currency),
              },
            ]}
          />
        ))}
      </MobileRecordList>
    </div>
  );
}
