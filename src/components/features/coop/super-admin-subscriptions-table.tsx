"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { TablePagination } from "@/components/ui/table-pagination";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { SubscriptionSummary } from "@/types/subscription";

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface SuperAdminSubscriptionsTableProps {
  subscriptions: SubscriptionSummary[];
}

const STATUS_OPTIONS = ["All statuses", "Active", "Overdue"] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function SuperAdminSubscriptionsTable({
  subscriptions,
}: SuperAdminSubscriptionsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const dateFrom = dateRange?.from ? toIsoDate(dateRange.from) : "";
  const dateTo = dateRange?.to ? toIsoDate(dateRange.to) : "";

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return subscriptions.filter((row) => {
      const matchesSearch =
        !query ||
        row.coopName.toLowerCase().includes(query) ||
        row.coopId.toLowerCase().includes(query);
      const matchesStatus = status === "All statuses" || row.status === status;
      const matchesFrom = !dateFrom || (row.lastPaymentDate ?? "") >= dateFrom;
      const matchesTo = !dateTo || (row.lastPaymentDate ?? "") <= dateTo;
      return matchesSearch && matchesStatus && matchesFrom && matchesTo;
    });
  }, [subscriptions, search, status, dateFrom, dateTo]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
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

        <Select
          value={status}
          onValueChange={(value) => {
            setStatus(value as (typeof STATUS_OPTIONS)[number]);
            setPage(1);
          }}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {STATUS_OPTIONS.map((option) => (
              <SelectItem key={option} value={option}>
                {option === "All statuses" ? "By status" : option}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Popover>
          <PopoverTrigger
            render={
              <Button
                variant="outline"
                size="sm"
                className="font-normal text-muted-foreground data-[has-range=true]:text-foreground"
                data-has-range={!!(dateFrom || dateTo)}
              />
            }
          >
            <CalendarIcon className="size-3.5" aria-hidden="true" />
            {dateRange?.from ? (
              dateRange.to ? (
                <>
                  {formatDateLong(dateRange.from)} –{" "}
                  {formatDateLong(dateRange.to)}
                </>
              ) : (
                formatDateLong(dateRange.from)
              )
            ) : (
              "Date range"
            )}
          </PopoverTrigger>
          <PopoverContent className="w-auto p-0" align="start">
            <Calendar
              mode="range"
              selected={dateRange}
              onSelect={(range) => {
                setDateRange(range);
                setPage(1);
              }}
              numberOfMonths={2}
              autoFocus
            />
            {dateRange?.from ? (
              <div className="flex justify-end border-t border-border p-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    setDateRange(undefined);
                    setPage(1);
                  }}
                >
                  Clear
                </Button>
              </div>
            ) : null}
          </PopoverContent>
        </Popover>
      </div>

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[900px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-op ID
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-op Name
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Revenue Earned
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Subscription Fee
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Billing Cycle
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Date of last payment
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
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No co-operatives match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map((row) => (
                <tr
                  key={row.coopId}
                  onClick={() => router.push(`/subscriptions/${row.coopId}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {row.coopId}
                  </td>
                  <td className="px-4 py-3 text-foreground">{row.coopName}</td>
                  <td className="px-4 py-3 text-foreground">
                    {formatNaira(row.revenueEarned)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatNaira(row.subscriptionFee)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.subscriptionCycle ?? "—"}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {row.lastPaymentDate
                      ? formatDateLong(new Date(row.lastPaymentDate))
                      : "—"}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        row.status === "Active" ? "secondary" : "destructive"
                      }
                      className={cn(
                        row.status === "Active" && "bg-success/15 text-success",
                      )}
                    >
                      {row.status}
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
        emptyMessage="No co-operatives match your filters."
      >
        {pageRows.map((row) => (
          <MobileRecordCard
            key={row.coopId}
            onClick={() => router.push(`/subscriptions/${row.coopId}`)}
            title={row.coopName}
            badge={
              <Badge
                variant={row.status === "Active" ? "secondary" : "destructive"}
                className={cn(
                  row.status === "Active" && "bg-success/15 text-success",
                )}
              >
                {row.status}
              </Badge>
            }
            fields={[
              { label: "Co-op ID", value: row.coopId },
              {
                label: "Revenue Earned",
                value: formatNaira(row.revenueEarned),
              },
              {
                label: "Subscription Fee",
                value: formatNaira(row.subscriptionFee),
              },
              { label: "Billing Cycle", value: row.subscriptionCycle ?? "—" },
              {
                label: "Date of last payment",
                value: row.lastPaymentDate
                  ? formatDateLong(new Date(row.lastPaymentDate))
                  : "—",
              },
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
