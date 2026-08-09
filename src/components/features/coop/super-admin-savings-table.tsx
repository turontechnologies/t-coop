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
import { coopSavingsTotal, type Cooperative } from "@/lib/coop-data";
import { formatMoney } from "@/lib/format";
import { SAVINGS_TYPES } from "@/lib/savings-data";
import { cn } from "@/lib/utils";

interface SuperAdminSavingsTableProps {
  cooperatives: Cooperative[];
}

const STATUS_OPTIONS = ["All statuses", "Active", "Disabled"] as const;
const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function SuperAdminSavingsTable({
  cooperatives,
}: SuperAdminSavingsTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [status, setStatus] =
    useState<(typeof STATUS_OPTIONS)[number]>("All statuses");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);

  const rows = useMemo(
    () =>
      cooperatives.map((coop) => ({
        coop,
        total: coopSavingsTotal(coop),
      })),
    [cooperatives],
  );

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    return rows.filter(({ coop }) => {
      const matchesSearch =
        !query ||
        coop.name.toLowerCase().includes(query) ||
        coop.id.toLowerCase().includes(query);
      const matchesStatus = status === "All statuses" || coop.status === status;
      return matchesSearch && matchesStatus;
    });
  }, [rows, search, status]);

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
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-op ID
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Co-op Name
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                No of Savings Types
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Total Savings & Contributions
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
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No co-operatives match your filters.
                </td>
              </tr>
            ) : (
              pageRows.map(({ coop, total }) => (
                <tr
                  key={coop.id}
                  onClick={() =>
                    router.push(`/co-operatives/${coop.id}?tab=savings`)
                  }
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {coop.id}
                  </td>
                  <td className="px-4 py-3 text-foreground">{coop.name}</td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {SAVINGS_TYPES.length}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {formatMoney(total, coop.currency)}
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
