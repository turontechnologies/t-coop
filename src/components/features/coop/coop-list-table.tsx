"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
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
import {
  coopLoansBySummaryType,
  coopLoansTotal,
  coopSavingsBySummaryType,
  coopSavingsTotal,
  type Cooperative,
} from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZE_OPTIONS = [5, 10, 25];

interface CoopListTableProps {
  cooperatives: Cooperative[];
}

export function CoopListTable({ cooperatives }: CoopListTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      cooperatives.map((coop) => ({
        coop,
        earningsOnSavings: coopSavingsBySummaryType(coop).reduce(
          (sum, type) => sum + type.earnings,
          0,
        ),
        totalSavings: coopSavingsTotal(coop),
        earningsOnLoans: coopLoansBySummaryType(coop).reduce(
          (sum, type) => sum + type.earnings,
          0,
        ),
        totalLoans: coopLoansTotal(coop),
      })),
    [cooperatives],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter(
      ({ coop }) =>
        coop.name.toLowerCase().includes(query) ||
        coop.id.toLowerCase().includes(query),
    );
  }, [rows, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageRows = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-xs">
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
        <table className="w-full min-w-[880px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-op ID
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-operative Name
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                No of members
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Earnings on Savings
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Total Savings
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Earnings on Loans
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Total Loans
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
                  colSpan={8}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No co-operatives match your search.
                </td>
              </tr>
            ) : (
              pageRows.map(
                ({
                  coop,
                  earningsOnSavings,
                  totalSavings,
                  earningsOnLoans,
                  totalLoans,
                }) => (
                  <tr
                    key={coop.id}
                    onClick={() => router.push(`/co-operatives/${coop.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3 font-medium text-foreground">
                      {coop.id}
                    </td>
                    <td className="px-4 py-3 text-foreground">{coop.name}</td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {coop.members.length.toLocaleString()}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNaira(earningsOnSavings)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatNaira(totalSavings)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatNaira(earningsOnLoans)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatNaira(totalLoans)}
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={
                          coop.status === "Active" ? "secondary" : "destructive"
                        }
                        className={cn(
                          coop.status === "Active" &&
                            "bg-success/15 text-success",
                        )}
                      >
                        {coop.status}
                      </Badge>
                    </td>
                  </tr>
                ),
              )
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
