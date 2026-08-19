"use client";

import { Landmark, Receipt, type LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { SuperAdminLoansTable } from "@/components/features/coop/super-admin-loans-table";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useAggregateInCurrency } from "@/hooks/use-aggregate-in-currency";
import { formatMoney } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import type { CooperativeSummary } from "@/types/cooperative";

/** Illustrative platform revenue figure (0.25% of real loan volume), not a real fee ledger —
 * same rate/honesty note as the per-co-op "Earnings on Loan" figure on the backend. */
const PLATFORM_LOANS_FEE_RATE = 0.0025;

const EXPORT_COLUMNS: ExportColumn<CooperativeSummary>[] = [
  { header: "Co-op ID", accessor: (coop) => coop.id },
  { header: "Co-op Name", accessor: (coop) => coop.name },
  { header: "No of Loan Types", accessor: (coop) => coop.loanTypeCount },
  { header: "Total Loans", accessor: (coop) => coop.totalLoans },
];

export function SuperAdminLoansView() {
  const cooperativesQuery = useCooperatives();
  const cooperatives = cooperativesQuery.data ?? [];

  const { total: totalLoans, loading: totalLoansLoading } =
    useAggregateInCurrency(
      cooperatives.map((coop) => ({
        amount: coop.totalLoans,
        currency: coop.currency,
      })),
      "NGN",
    );
  const transactionFees =
    totalLoans === null ? null : totalLoans * PLATFORM_LOANS_FEE_RATE;

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 sm:max-w-lg">
        <SummaryCard
          label="Total Loans"
          value={totalLoans}
          loading={totalLoansLoading}
          icon={Landmark}
        />
        <SummaryCard
          label="Transaction Fees Received"
          value={transactionFees}
          loading={totalLoansLoading}
          icon={Receipt}
        />
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="total">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTab value="total">Total Loans</TabsTab>
                <TabsIndicator />
              </TabsList>
              <ExportImportMenu
                rows={cooperatives}
                columns={EXPORT_COLUMNS}
                filenamePrefix="all-cooperatives-loans"
                exportTitle="Loans — All Co-operatives"
                entityLabel="co-operative"
              />
            </div>

            <TabsPanel value="total">
              <QueryBoundary
                isLoading={cooperativesQuery.isLoading}
                isError={cooperativesQuery.isError}
                error={cooperativesQuery.error}
                onRetry={() => cooperativesQuery.refetch()}
                isRetrying={cooperativesQuery.isFetching}
              >
                <SuperAdminLoansTable cooperatives={cooperatives} />
              </QueryBoundary>
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  loading = false,
  icon: Icon,
}: {
  label: string;
  value: number | null;
  loading?: boolean;
  icon: LucideIcon;
}) {
  return (
    <Card>
      <CardContent className="flex items-start justify-between gap-3">
        <div className="space-y-1.5">
          <p className="text-sm text-muted-foreground">{label}</p>
          <p className="text-xl font-semibold text-foreground sm:text-2xl">
            {loading || value === null ? "…" : formatMoney(value, "NGN")}
          </p>
        </div>
        <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
          <Icon className="size-5" aria-hidden="true" />
        </span>
      </CardContent>
    </Card>
  );
}
