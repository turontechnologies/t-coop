"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoopSavingsTypeRecordsTable } from "@/components/features/coop/coop-savings-type-records-table";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { formatMoney } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import type { CoopSavingsRecord } from "@/lib/coop-data";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopSavingsRecords } from "@/hooks/use-coop-savings";

interface CoopSavingsTypePageProps {
  params: Promise<{ id: string; type: string }>;
}

const EXPORT_COLUMNS: ExportColumn<CoopSavingsRecord>[] = [
  { header: "Members Id", accessor: (record) => record.memberId },
  { header: "Full Name", accessor: (record) => record.memberName },
  { header: "Savings Amount", accessor: (record) => record.amount },
  { header: "Date", accessor: (record) => record.date },
  { header: "Status", accessor: (record) => record.status },
];

export default function CoopSavingsTypePage({
  params,
}: CoopSavingsTypePageProps) {
  const { id, type } = use(params);
  const savingsType = decodeURIComponent(type);
  const router = useRouter();
  const coopQuery = useCooperative(id);
  const coop = coopQuery.data;
  const recordsQuery = useCoopSavingsRecords(id, { type: savingsType });
  const records = recordsQuery.data;

  const total = useMemo(
    () => (records ?? []).reduce((sum, record) => sum + record.amount, 0),
    [records],
  );

  if (coopQuery.isError) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that co-operative.
        </p>
        <Button variant="outline" onClick={() => router.push("/co-operatives")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Co-operatives
        </Button>
      </div>
    );
  }

  if (coopQuery.isLoading || !coop) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <CurrencyProvider currency={coop.currency}>
      <div className="space-y-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/co-operatives/${coop.id}`)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        <div className="space-y-6">
          <h2 className="text-sm font-semibold text-foreground">
            Quick Summary
          </h2>

          <Card className="max-w-xs">
            <CardContent className="flex items-start justify-between gap-3">
              <div className="space-y-1.5">
                <p className="text-sm text-muted-foreground">
                  Total {savingsType}
                </p>
                <p className="text-xl font-semibold text-foreground sm:text-2xl">
                  {formatMoney(total, coop.currency)}
                </p>
              </div>
              <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
                <PiggyBank className="size-5" aria-hidden="true" />
              </span>
            </CardContent>
          </Card>

          <Card>
            <CardContent>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <h3 className="text-sm font-semibold text-foreground">
                  Savings Record
                </h3>
                <ExportImportMenu
                  rows={records ?? []}
                  columns={EXPORT_COLUMNS}
                  filenamePrefix={`${coop.id}-${savingsType}`}
                  exportTitle={`${coop.name} — ${savingsType}`}
                />
              </div>
              <QueryBoundary
                isLoading={recordsQuery.isLoading}
                isError={recordsQuery.isError}
                error={recordsQuery.error}
                onRetry={() => recordsQuery.refetch()}
                isRetrying={recordsQuery.isFetching}
              >
                <CoopSavingsTypeRecordsTable
                  coopId={coop.id}
                  records={records ?? []}
                />
              </QueryBoundary>
            </CardContent>
          </Card>
        </div>
      </div>
    </CurrencyProvider>
  );
}
