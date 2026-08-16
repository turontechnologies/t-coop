"use client";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubscriptionPayment } from "@/types/subscription";

interface SupportTransactionHistoryProps {
  payments: SubscriptionPayment[];
  onViewReceipt: (payment: SubscriptionPayment) => void;
}

export function SupportTransactionHistory({
  payments,
  onViewReceipt,
}: SupportTransactionHistoryProps) {
  if (payments.length === 0) {
    return (
      <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
        No subscription payments yet.
      </p>
    );
  }

  return (
    <>
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Ref
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Amount Paid
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Type</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Cycle</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Receipt
              </th>
            </tr>
          </thead>
          <tbody>
            {payments.map((payment) => (
              <tr
                key={payment.id}
                className="border-b border-border last:border-0"
              >
                <td className="px-4 py-3 font-medium text-foreground">
                  {payment.paymentRef}
                </td>
                <td className="px-4 py-3 text-foreground">
                  {formatNaira(payment.amountPaid)}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {formatDateLong(new Date(payment.date))}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.type}
                </td>
                <td className="px-4 py-3 text-muted-foreground">
                  {payment.cycle}
                </td>
                <td className="px-4 py-3">
                  <Badge
                    variant={
                      payment.status === "Active" ? "secondary" : "destructive"
                    }
                    className={cn(
                      payment.status === "Active" &&
                        "bg-success/15 text-success",
                    )}
                  >
                    {payment.status}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => onViewReceipt(payment)}
                  >
                    View
                  </Button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <MobileRecordList isEmpty={false}>
        {payments.map((payment) => (
          <MobileRecordCard
            key={payment.id}
            onClick={() => onViewReceipt(payment)}
            title={payment.paymentRef}
            badge={
              <Badge
                variant={
                  payment.status === "Active" ? "secondary" : "destructive"
                }
                className={cn(
                  payment.status === "Active" && "bg-success/15 text-success",
                )}
              >
                {payment.status}
              </Badge>
            }
            fields={[
              { label: "Amount Paid", value: formatNaira(payment.amountPaid) },
              { label: "Date", value: formatDateLong(new Date(payment.date)) },
              { label: "Type", value: payment.type },
              { label: "Cycle", value: payment.cycle },
            ]}
          />
        ))}
      </MobileRecordList>
    </>
  );
}
