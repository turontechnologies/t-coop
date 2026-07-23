"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  coopLoanStatusBadgeVariant,
  type CoopLoanRecord,
} from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { LOAN_TYPES } from "@/lib/loans-data";

interface LoanRequestsTableProps {
  requests: CoopLoanRecord[];
}

const TYPE_OPTIONS = [
  "All types",
  ...LOAN_TYPES.map((type) => type.name),
] as const;

export function LoanRequestsTable({ requests }: LoanRequestsTableProps) {
  const router = useRouter();
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>("All types");

  const filtered = useMemo(
    () =>
      type === "All types"
        ? requests
        : requests.filter((record) => record.loanType === type),
    [requests, type],
  );

  if (requests.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No loan requests awaiting a decision.
      </p>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3">
        <Select
          value={type}
          onValueChange={(value) =>
            setType(value as (typeof TYPE_OPTIONS)[number])
          }
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {TYPE_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All types" ? "By loan type" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

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
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No loan requests match your filter.
                </td>
              </tr>
            ) : (
              filtered.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => router.push(`/loans/request/${record.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {record.memberId}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {record.memberName}
                  </td>
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
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
