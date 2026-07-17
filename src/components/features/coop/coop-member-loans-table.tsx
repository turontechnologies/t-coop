"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CoopMemberLoansTableProps {
  coopId: string;
  records: CoopLoanRecord[];
}

export function CoopMemberLoansTable({
  coopId,
  records,
}: CoopMemberLoansTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Product
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Amount</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Repayment
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {records.length === 0 ? (
            <tr>
              <td
                colSpan={5}
                className="px-4 py-8 text-center text-muted-foreground"
              >
                No loan records yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.id}
                onClick={() =>
                  router.push(
                    `/co-operatives/${coopId}/loans/record/${record.id}`,
                  )
                }
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {record.loanType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatNaira(record.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatNaira(record.monthlyRepayment)}/mo
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateLong(new Date(record.date))}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      record.status === "Active" ||
                      record.status === "Completed"
                        ? "secondary"
                        : record.status === "Awaiting Approval"
                          ? "outline"
                          : "destructive"
                    }
                    className={cn(
                      record.status === "Active" &&
                        "bg-success/15 text-success",
                      record.status === "Completed" &&
                        "bg-primary/10 text-primary",
                    )}
                  >
                    {record.status}
                  </Badge>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
