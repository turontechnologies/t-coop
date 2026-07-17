"use client";

import { useRouter } from "next/navigation";
import { Badge } from "@/components/ui/badge";
import type { CoopSavingsRecord } from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface CoopMemberSavingsTableProps {
  coopId: string;
  records: CoopSavingsRecord[];
}

export function CoopMemberSavingsTable({
  coopId,
  records,
}: CoopMemberSavingsTableProps) {
  const router = useRouter();

  return (
    <div className="overflow-x-auto rounded-xl border border-border">
      <table className="w-full min-w-[560px] text-left text-sm">
        <thead>
          <tr className="border-b border-border bg-accent/60">
            <th className="px-4 py-2.5 font-medium text-foreground">
              Savings Ref
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Savings Product
            </th>
            <th className="px-4 py-2.5 font-medium text-foreground">Amount</th>
            <th className="px-4 py-2.5 font-medium text-foreground">
              Date Saved
            </th>
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
                No savings records yet.
              </td>
            </tr>
          ) : (
            records.map((record) => (
              <tr
                key={record.id}
                onClick={() =>
                  router.push(
                    `/co-operatives/${coopId}/savings/record/${record.id}`,
                  )
                }
                className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {record.transactionId}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {record.savingsType}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatNaira(record.amount)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateLong(new Date(record.date))}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      record.status === "Success"
                        ? "secondary"
                        : record.status === "Pending"
                          ? "outline"
                          : "destructive"
                    }
                    className={cn(
                      record.status === "Success" &&
                        "bg-success/15 text-success",
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
