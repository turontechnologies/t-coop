"use client";

import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { CoopSubscriptionPayment } from "@/lib/coop-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SubscriptionHistoryTableProps {
  payments: CoopSubscriptionPayment[];
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
        payment.narration.toLowerCase().includes(query),
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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Ref
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Amount Paid
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Method
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Payment Date
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Narration
              </th>
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
                    {payment.method}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateLong(new Date(payment.date))}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {payment.narration}
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

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>View</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-muted-foreground"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              type="button"
              variant={num === currentPage ? "default" : "ghost"}
              size="icon"
              onClick={() => setPage(num)}
              className="text-sm font-medium"
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-muted-foreground"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>
    </div>
  );
}
