"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Search } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { CoopCurrencyDisplay } from "@/components/features/coop/coop-currency-display";
import {
  coopLoansBySummaryType,
  coopLoansTotal,
  coopSavingsBySummaryType,
  coopSavingsTotal,
  type Cooperative,
} from "@/lib/coop-data";
import { formatMoney } from "@/lib/format";
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

      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
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
                Currency
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
                  colSpan={9}
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
                      {formatMoney(earningsOnSavings, coop.currency)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMoney(totalSavings, coop.currency)}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatMoney(earningsOnLoans, coop.currency)}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      {formatMoney(totalLoans, coop.currency)}
                    </td>
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <CoopCurrencyDisplay currency={coop.currency} />
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

      <MobileRecordList
        isEmpty={pageRows.length === 0}
        emptyMessage="No co-operatives match your search."
      >
        {pageRows.map(
          ({
            coop,
            earningsOnSavings,
            totalSavings,
            earningsOnLoans,
            totalLoans,
          }) => (
            <MobileRecordCard
              key={coop.id}
              onClick={() => router.push(`/co-operatives/${coop.id}`)}
              title={coop.name}
              badge={
                <Badge
                  variant={
                    coop.status === "Active" ? "secondary" : "destructive"
                  }
                  className={cn(
                    coop.status === "Active" && "bg-success/15 text-success",
                  )}
                >
                  {coop.status}
                </Badge>
              }
              fields={[
                { label: "Co-op ID", value: coop.id },
                {
                  label: "No of members",
                  value: coop.members.length.toLocaleString(),
                },
                {
                  label: "Earnings on Savings",
                  value: formatMoney(earningsOnSavings, coop.currency),
                },
                {
                  label: "Total Savings",
                  value: formatMoney(totalSavings, coop.currency),
                },
                {
                  label: "Earnings on Loans",
                  value: formatMoney(earningsOnLoans, coop.currency),
                },
                {
                  label: "Total Loans",
                  value: formatMoney(totalLoans, coop.currency),
                },
                {
                  label: "Currency",
                  value: <CoopCurrencyDisplay currency={coop.currency} />,
                },
              ]}
            />
          ),
        )}
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
