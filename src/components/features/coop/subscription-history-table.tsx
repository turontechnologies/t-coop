"use client";

import { useMemo, useState } from "react";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { TablePagination } from "@/components/ui/table-pagination";
import type { SubscriptionPayment } from "@/types/subscription";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SubscriptionHistoryTableProps {
  payments: SubscriptionPayment[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function SubscriptionHistoryTable({
  payments,
}: SubscriptionHistoryTableProps) {
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return payments;
    return payments.filter(
      (payment) =>
        payment.paymentRef.toLowerCase().includes(query) ||
        payment.type.toLowerCase().includes(query) ||
        payment.cycle.toLowerCase().includes(query),
    );
  }, [payments, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="relative min-w-[200px] max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search"
          className="h-9 pl-8"
        />
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[820px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Ref
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Amount Paid
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Date
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Type</th>
              <th className="px-4 py-2.5 font-medium text-foreground">Cycle</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRows.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No subscription payments match your search.
                </td>
              </tr>
            ) : (
              pageRows.map((payment) => (
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
                        payment.status === "Active"
                          ? "secondary"
                          : "destructive"
                      }
                      className={cn(
                        payment.status === "Active" &&
                          "bg-success/15 text-success",
                      )}
                    >
                      {payment.status}
                    </Badge>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={pageRows.length === 0}
        emptyMessage="No subscription payments match your search."
      >
        {pageRows.map((payment) => (
          <MobileRecordCard
            key={payment.id}
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
              {
                label: "Payment Date",
                value: formatDateLong(new Date(payment.date)),
              },
              { label: "Type", value: payment.type },
              { label: "Cycle", value: payment.cycle },
            ]}
          />
        ))}
      </MobileRecordList>

      {filtered.length > 0 ? (
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null}
    </div>
  );
}
