"use client";

import { use, useMemo } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Landmark } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CoopLoanTypeRecordsTable } from "@/components/features/coop/coop-loan-type-records-table";
import {
  ExportImportMenu,
  type ImportConfig,
  type ImportResult,
} from "@/components/features/shared/export-import-menu";
import { useCooperative } from "@/hooks/use-cooperative";
import {
  useCoopLoanRecords,
  useCoopLoanTypes,
  useImportCoopLoan,
} from "@/hooks/use-coop-loans";
import { useTabAccess } from "@/hooks/use-permission";
import { formatMoney } from "@/lib/format";
import {
  downloadLoanImportTemplate,
  parseLoanImportFile,
  type ImportedLoanRow,
} from "@/lib/loan-import";
import type { ExportColumn } from "@/lib/table-export";
import type { CoopLoanRecord } from "@/lib/coop-data";
import { useAuthStore } from "@/store/auth.store";

interface AdminLoanTypePageProps {
  params: Promise<{ type: string }>;
}

const EXPORT_COLUMNS: ExportColumn<CoopLoanRecord>[] = [
  { header: "Members Id", accessor: (record) => record.memberId },
  { header: "Full Name", accessor: (record) => record.memberName },
  { header: "Loan Amount", accessor: (record) => record.amount },
  { header: "Date", accessor: (record) => record.date },
  { header: "Status", accessor: (record) => record.status },
];

export default function AdminLoanTypePage({ params }: AdminLoanTypePageProps) {
  const { type } = use(params);
  const loanType = decodeURIComponent(type);
  const router = useRouter();
  const authMember = useAuthStore((state) => state.member);
  const coopId =
    authMember?.cooperativeId ??
    (authMember?.role === "admin" ? authMember.id : undefined);
  const { data: coop } = useCooperative(coopId);
  const { data: records = [] } = useCoopLoanRecords(coopId, {
    type: loanType,
  });

  const total = useMemo(
    () => records.reduce((sum, record) => sum + record.amount, 0),
    [records],
  );

  // Import is for whoever can manage members' loans (the admin, or staff with write access to
  // Members Loans) — never on a member's own loans, which only export.
  const membersLoansAccess = useTabAccess("Loans", "Members Loans");
  const canImport =
    authMember?.role !== "member" &&
    authMember?.role !== "super_admin" &&
    membersLoansAccess === "write";
  const { data: loanTypes = [] } = useCoopLoanTypes(coopId, canImport);
  const loanTypeSummary = loanTypes.find((item) => item.name === loanType);
  const importLoan = useImportCoopLoan(coopId);

  const handleImport = async (
    rows: ImportedLoanRow[],
  ): Promise<ImportResult> => {
    let imported = 0;
    const errors: ImportResult["errors"] = [];
    for (const row of rows) {
      try {
        await importLoan.mutateAsync({
          memberId: row.memberId,
          loanTypeId: row.loanTypeId,
          amount: row.amount,
          loanMode: row.loanMode,
          guarantorMemberId: row.guarantorMemberId,
          startDate: row.startDate,
          repaymentsMade: row.repaymentsMade,
        });
        imported += 1;
      } catch (error) {
        errors.push({
          row: row.rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "Could not import this loan",
        });
      }
    }
    return { imported, errors };
  };

  const importConfig: ImportConfig<ImportedLoanRow> | undefined =
    canImport && loanTypeSummary
      ? {
          templateStorageKey: `members-loans-${coopId}-${loanTypeSummary.id}-template-downloaded`,
          downloadTemplate: () => downloadLoanImportTemplate(loanTypeSummary),
          parseFile: (file) => parseLoanImportFile(file, loanTypeSummary),
          onImport: handleImport,
        }
      : undefined;

  if (!coop) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find your co-operative.
        </p>
        <Button variant="outline" onClick={() => router.push("/loans")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Loans
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/loans")}
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
              <p className="text-sm text-muted-foreground">Total {loanType}</p>
              <p className="text-xl font-semibold text-foreground sm:text-2xl">
                {formatMoney(total, coop.currency)}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <Landmark className="size-5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                Loan Records
              </h3>
              <ExportImportMenu
                rows={records}
                columns={EXPORT_COLUMNS}
                filenamePrefix={`${coop.id}-${loanType}`}
                exportTitle={`${coop.name} — ${loanType}`}
                importConfig={importConfig}
              />
            </div>
            <CoopLoanTypeRecordsTable
              coopId={coop.id}
              records={records}
              basePath="/loans/record"
            />
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
