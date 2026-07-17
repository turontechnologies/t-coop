"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { SAVINGS_TYPES, type SavingsRecord } from "@/lib/savings-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

interface SavingsRecordsTableProps {
  records: SavingsRecord[];
}

const STATUS_OPTIONS = [
  "All statuses",
  "Success",
  "Pending",
  "Failed",
] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

function minMaxFor(savingsType: string) {
  return SAVINGS_TYPES.find((type) => type.name === savingsType);
}

export function SavingsRecordsTable({ records }: SavingsRecordsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        search.trim() === "" ||
        record.savingsType.toLowerCase().includes(search.toLowerCase()) ||
        record.transactionId.toLowerCase().includes(search.toLowerCase()) ||
        record.memberName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        status === "All statuses" || record.status === status;
      const matchesFrom = !dateFrom || record.date >= dateFrom;
      const matchesTo = !dateTo || record.date <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [records, search, status, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRecords = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative min-w-[200px] flex-1 sm:flex-none sm:w-64">
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

        <select
          value={status}
          onChange={(event) => {
            setStatus(event.target.value as (typeof STATUS_OPTIONS)[number]);
            setPage(1);
          }}
          className="h-9 rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
        >
          {STATUS_OPTIONS.map((option) => (
            <option key={option} value={option}>
              {option === "All statuses" ? "By status" : option}
            </option>
          ))}
        </select>

        <div className="flex items-center gap-1.5 text-sm text-muted-foreground">
          <input
            type="date"
            aria-label="From date"
            value={dateFrom}
            onChange={(event) => {
              setDateFrom(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
          <span>–</span>
          <input
            type="date"
            aria-label="To date"
            value={dateTo}
            onChange={(event) => {
              setDateTo(event.target.value);
              setPage(1);
            }}
            className="h-9 rounded-lg border border-input bg-transparent px-2 text-xs outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          />
        </div>
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
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
                Savings Amount
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Date</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pageRecords.length === 0 ? (
              <tr>
                <td
                  colSpan={6}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No savings records match your filters.
                </td>
              </tr>
            ) : (
              pageRecords.map((record) => {
                const range = minMaxFor(record.savingsType);
                return (
                  <tr
                    key={record.id}
                    onClick={() => router.push(`/savings/${record.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {record.savingsType}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {range ? formatNaira(range.min) : "—"}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {range ? formatNaira(range.max) : "—"}
                    </td>
                    <td className="px-4 py-3 text-foreground">
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
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>View</span>
          <select
            value={pageSize}
            onChange={(event) => {
              setPageSize(Number(event.target.value));
              setPage(1);
            }}
            className="h-8 rounded-lg border border-input bg-transparent px-2 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
          >
            {PAGE_SIZE_OPTIONS.map((size) => (
              <option key={size} value={size}>
                {size}
              </option>
            ))}
          </select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              type="button"
              onClick={() => setPage(num)}
              className={cn(
                "flex size-8 items-center justify-center rounded-lg text-sm font-medium",
                num === currentPage
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-muted",
              )}
            >
              {num}
            </button>
          ))}
          <button
            type="button"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="flex size-8 items-center justify-center rounded-lg text-muted-foreground hover:bg-muted disabled:pointer-events-none disabled:opacity-40"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
