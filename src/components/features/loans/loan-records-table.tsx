"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { DateRange } from "react-day-picker";
import { CalendarIcon, ChevronLeft, ChevronRight, Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Input } from "@/components/ui/input";
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
import { LOAN_TYPES, type LoanRecord, type LoanStatus } from "@/lib/loans-data";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface LoanRecordsTableProps {
  records: LoanRecord[];
}

const STATUS_OPTIONS = [
  "All statuses",
  "Active",
  "Awaiting Approval",
  "Completed",
  "Rejected",
] as const;
const TYPE_OPTIONS = [
  "All types",
  ...LOAN_TYPES.map((type) => type.name),
] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

function statusBadgeVariant(status: LoanStatus) {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Awaiting Approval") return "outline";
  return "destructive";
}

export function LoanRecordsTable({ records }: LoanRecordsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [type, setType] = useState<(typeof TYPE_OPTIONS)[number]>("All types");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const dateFrom = dateRange?.from ? toIsoDate(dateRange.from) : "";
  const dateTo = dateRange?.to ? toIsoDate(dateRange.to) : "";

  const filtered = useMemo(() => {
    return records.filter((record) => {
      const matchesSearch =
        search.trim() === "" ||
        record.loanType.toLowerCase().includes(search.toLowerCase()) ||
        record.memberName.toLowerCase().includes(search.toLowerCase()) ||
        record.guarantorName.toLowerCase().includes(search.toLowerCase());
      const matchesStatus =
        status === "All statuses" || record.status === status;
      const matchesType = type === "All types" || record.loanType === type;
      const matchesFrom = !dateFrom || record.date >= dateFrom;
      const matchesTo = !dateTo || record.date <= dateTo;
      return (
        matchesSearch &&
        matchesStatus &&
        matchesType &&
        matchesFrom &&
        matchesTo
      );
    });
  }, [records, search, status, type, dateFrom, dateTo]);

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

        <Select
          value={type}
          onValueChange={(value) => {
            setType(value as (typeof TYPE_OPTIONS)[number]);
            setPage(1);
          }}
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

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[760px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Loan Type
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Loan Amount
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                No of Repayments
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Repayment Amount
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
                  No loan records match your filters.
                </td>
              </tr>
            ) : (
              pageRecords.map((record) => (
                <tr
                  key={record.id}
                  onClick={() => router.push(`/loans/${record.id}`)}
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {record.loanType}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatNaira(record.amount)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.numberOfRepayments}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatNaira(record.monthlyRepayment)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatDateLong(new Date(record.date))}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={statusBadgeVariant(record.status)}
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
