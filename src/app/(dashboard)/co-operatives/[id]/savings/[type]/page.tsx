"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, PiggyBank } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoopSavingsTypeRecordsTable } from "@/components/features/coop/coop-savings-type-records-table";
import { ExportImportMenu } from "@/components/features/savings/export-import-menu";
import { findCooperative } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import type { ExportColumn } from "@/lib/table-export";
import type { CoopSavingsRecord } from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";

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
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = findCooperative(cooperatives, id);

  const records = useMemo(
    () =>
      coop?.savings.filter((record) => record.savingsType === savingsType) ??
      [],
    [coop, savingsType],
  );
  const total = useMemo(
    () => records.reduce((sum, record) => sum + record.amount, 0),
    [records],
  );

  if (!coop) {
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

  return (
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
        <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>

        <Card className="max-w-xs">
          <CardContent className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">
                Total {savingsType}
              </p>
              <p className="text-xl font-semibold text-foreground sm:text-2xl">
                {formatNaira(total)}
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
                rows={records}
                columns={EXPORT_COLUMNS}
                filenamePrefix={`${coop.id}-${savingsType}`}
                exportTitle={`${coop.name} — ${savingsType}`}
              />
            </div>
            <CoopSavingsTypeRecordsTable coopId={coop.id} records={records} />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
