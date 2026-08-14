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
import { SuperAdminLoansTable } from "@/components/features/coop/super-admin-loans-table";
import {
  coopLoansTotal,
  platformLoansFeesTotal,
  type Cooperative,
} from "@/lib/coop-data";
import { useAggregateInCurrency } from "@/hooks/use-aggregate-in-currency";
import { formatMoney } from "@/lib/format";
import { LOAN_TYPES } from "@/lib/loans-data";
import type { ExportColumn } from "@/lib/table-export";
import { useCoopStore } from "@/store/coop.store";

const EXPORT_COLUMNS: ExportColumn<{ coop: Cooperative; total: number }>[] = [
  { header: "Co-op ID", accessor: (row) => row.coop.id },
  { header: "Co-op Name", accessor: (row) => row.coop.name },
  { header: "No of Loan Types", accessor: () => LOAN_TYPES.length },
  { header: "Total Loans", accessor: (row) => row.total },
];

export function SuperAdminLoansView() {
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const transactionFees = platformLoansFeesTotal(cooperatives);
  const exportRows = cooperatives.map((coop) => ({
    coop,
    total: coopLoansTotal(coop),
  }));
  const { total: totalLoans, loading: totalLoansLoading } =
    useAggregateInCurrency(
      exportRows.map(({ coop, total }) => ({
        amount: total,
        currency: coop.currency,
      })),
      "NGN",
    );

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
                rows={exportRows}
                columns={EXPORT_COLUMNS}
                filenamePrefix="all-cooperatives-loans"
                exportTitle="Loans — All Co-operatives"
                entityLabel="co-operative"
              />
            </div>

            <TabsPanel value="total">
              <SuperAdminLoansTable cooperatives={cooperatives} />
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
