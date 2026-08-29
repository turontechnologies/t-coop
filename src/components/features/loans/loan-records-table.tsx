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
import type { CoopLoanRecord, CoopLoanStatus } from "@/lib/coop-data";
import { useCurrency } from "@/components/providers/currency-provider";
import { formatDateLong, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

function toIsoDate(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

interface LoanRecordsTableProps {
  records: CoopLoanRecord[];
}

const STATUS_OPTIONS = [
  "All statuses",
  "Awaiting Guarantor",
  "Awaiting Admin",
  "Active",
  "Completed",
  "Rejected",
] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

function statusBadgeVariant(status: CoopLoanStatus) {
  if (status === "Active" || status === "Completed") return "secondary";
  if (status === "Awaiting Guarantor" || status === "Awaiting Admin")
    return "outline";
  return "destructive";
}

export function LoanRecordsTable({ records }: LoanRecordsTableProps) {
  const router = useRouter();
  const currency = useCurrency();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [type, setType] = useState<string>("All types");
  const [dateRange, setDateRange] = useState<DateRange | undefined>();
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const typeOptions = useMemo(
    () => [
      "All types",
      ...Array.from(new Set(records.map((record) => record.loanType))),
    ],
    [records],
  );

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

  const filteredTotal = useMemo(
    () => filtered.reduce((sum, record) => sum + record.amount, 0),
    [filtered],
  );

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
            setType(value ?? "All types");
            setPage(1);
          }}
        >
          <SelectTrigger size="sm" className="w-40">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {typeOptions.map((option) => (
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

      {type !== "All types" ? (
        <div className="flex items-center justify-between rounded-lg bg-accent/60 px-4 py-2.5 text-sm">
          <span className="text-muted-foreground">Total {type}</span>
          <span className="font-semibold text-foreground">
            {formatMoney(filteredTotal, currency)}
          </span>
        </div>
      ) : null}

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
                    {formatMoney(record.amount, currency)}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {record.numberOfRepayments}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {formatMoney(record.monthlyRepayment, currency)}
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

      <MobileRecordList
        isEmpty={pageRecords.length === 0}
        emptyMessage="No loan records match your filters."
      >
        {pageRecords.map((record) => (
          <MobileRecordCard
            key={record.id}
            onClick={() => router.push(`/loans/${record.id}`)}
            title={record.loanType}
            badge={
              <Badge
                variant={statusBadgeVariant(record.status)}
                className={cn(
                  record.status === "Active" && "bg-success/15 text-success",
                  record.status === "Completed" && "bg-primary/10 text-primary",
                )}
              >
                {record.status}
              </Badge>
            }
            fields={[
              {
                label: "Loan Amount",
                value: formatMoney(record.amount, currency),
              },
              {
                label: "No of Repayments",
                value: record.numberOfRepayments,
              },
              {
                label: "Repayment Amount",
                value: formatMoney(record.monthlyRepayment, currency),
              },
              {
                label: "Date",
                value: formatDateLong(new Date(record.date)),
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
