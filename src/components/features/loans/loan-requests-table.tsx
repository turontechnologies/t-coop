"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  coopLoanStatusBadgeVariant,
  type CoopLoanRecord,
} from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";

interface LoanRequestsTableProps {
  requests: CoopLoanRecord[];
}

export function LoanRequestsTable({ requests }: LoanRequestsTableProps) {
  const router = useRouter();

  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No loan requests awaiting a decision.
      </p>
    );
  }

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[760px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Members Id
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Full Name
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Type
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Loan Amount
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              No of Repayments
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
            <th className="px-4 py-2.5 font-medium text-foreground">Status</th>
          </tr>
        </thead>
        <tbody>
          {requests.map((record) => (
            <tr
              key={record.id}
              onClick={() => router.push(`/loans/request/${record.id}`)}
              className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
            >
              <td className="px-4 py-3 font-medium text-foreground">
                {record.memberId}
              </td>
              <td className="px-4 py-3 text-foreground">{record.memberName}</td>
              <td className="px-4 py-3 text-muted-foreground">
                {record.loanType}
              </td>
              <td className="px-4 py-3 text-foreground">
                {formatNaira(record.amount)}
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {record.numberOfRepayments} Months
              </td>
              <td className="px-4 py-3 text-muted-foreground">
                {formatDateLong(new Date(record.date))}
              </td>
              <td className="px-4 py-3">
                <Badge variant={coopLoanStatusBadgeVariant(record.status)}>
                  {record.status}
                </Badge>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
