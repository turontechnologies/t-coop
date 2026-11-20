"use client";

import { useMemo, useState } from "react";
import { Download, FileSpreadsheet, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { MemberStatementDialog } from "@/components/features/reports/member-statement-dialog";
import { ReportFilters } from "@/components/features/reports/report-filters";
import { ReportKpis } from "@/components/features/reports/report-kpis";
import {
  LoansTab,
  MembersTab,
} from "@/components/features/reports/report-loans";
import {
  IncomeTab,
  OverviewTab,
  REPORT_COLORS,
  SavingsTab,
  type ReportTab,
} from "@/components/features/reports/report-overview";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { useModuleAccess } from "@/hooks/use-permission";
import {
  exportFinancialReportExcel,
  exportFinancialReportPdf,
} from "@/lib/financial-report-export";
import {
  period,
  periodLabel,
  previousPeriod,
  type ReportRange,
} from "@/lib/report-periods";
import type { FinancialReport } from "@/services/report.service";
import { useAuthStore } from "@/store/auth.store";

/** For "All time", start from the first month that has any money in it. */
function trimAllTime(report: FinancialReport): FinancialReport {
  const first = report.monthly.findIndex(
    (m) =>
      m.deposits ||
      m.withdrawals ||
      m.loansPaidOut ||
      m.repayments ||
      m.income ||
      m.closingBalance,
  );
  if (first <= 0) return report;
  const monthly = report.monthly.slice(first);
  return { ...report, monthly, from: `${monthly[0].month}-01` };
}

export default function ReportsPage() {
  const member = useAuthStore((state) => state.member);
  const access = useModuleAccess("Reports");
  const coopId = member?.cooperativeId ?? member?.id;
  const isCoopSide =
    member?.role === "admin" || member?.permissionModules != null;
  const allowed = isCoopSide && access !== null;

  const [range, setRange] = useState<ReportRange>(() => period("year"));
  const [compare, setCompare] = useState(true);
  const [tab, setTab] = useState<ReportTab>("overview");
  const [statementFor, setStatementFor] = useState<string | null>(null);

  const before = compare ? previousPeriod(range) : null;
  const current = useFinancialReport(allowed ? coopId : undefined, range);
  const previous = useFinancialReport(allowed ? coopId : undefined, before);

  const report = useMemo(
    () =>
      current.data && range.key === "all"
        ? trimAllTime(current.data)
        : current.data,
    [current.data, range.key],
  );
  const prev = before ? (previous.data ?? null) : null;

  if (!member) return null;
  if (!allowed) {
    return (
      <div className="pt-6">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to financial reports.
        </p>
      </div>
    );
  }

  const download = (fn: (r: FinancialReport) => void, what: string) => {
    if (!report) return;
    try {
      fn(report);
      toast.success(`${what} downloaded.`);
    } catch (err) {
      toast.error(`Couldn't build the ${what.toLowerCase()}`, {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  const shownRange =
    report && range.key === "all" ? { ...range, from: report.from } : range;
  const statementMember =
    report?.members.find((m) => m.memberId === statementFor) ?? null;

  return (
    <div className="space-y-6 pt-6 pb-12" style={REPORT_COLORS}>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h2 className="text-[2rem] leading-tight font-bold tracking-tight text-foreground">
            Financial report
          </h2>
          <p className="mt-1.5 text-muted-foreground">
            Savings, loans, repayments and income for your co-operative.
          </p>
        </div>
        <div className="flex items-center gap-2.5">
          {current.isFetching && report ? (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Updating"
            />
          ) : null}
          <Button
            variant="outline"
            disabled={!report}
            onClick={() => download(exportFinancialReportExcel, "Excel report")}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Excel
          </Button>
          <Button
            variant="outline"
            disabled={!report}
            onClick={() => download(exportFinancialReportPdf, "PDF report")}
          >
            <Download className="size-4" aria-hidden="true" />
            PDF
          </Button>
        </div>
      </div>

      <ReportFilters
        range={shownRange}
        onRangeChange={setRange}
        compare={compare}
        onCompareChange={setCompare}
      />

      <QueryBoundary
        isLoading={current.isLoading}
        isError={current.isError}
        error={current.error}
        onRetry={() => current.refetch()}
        isRetrying={current.isFetching}
        errorTitle="Couldn't load the report"
      >
        {report ? (
          <div className="space-y-6">
            <ReportKpis report={report} previous={prev} />

            <Tabs
              value={tab}
              onValueChange={(value) => setTab(value as ReportTab)}
            >
              <TabsList>
                <TabsTab value="overview">Overview</TabsTab>
                <TabsTab value="savings">Savings</TabsTab>
                <TabsTab value="loans">Loans</TabsTab>
                <TabsTab value="income">Income</TabsTab>
                <TabsTab value="members">Members</TabsTab>
                <TabsIndicator />
              </TabsList>
              <TabsPanel value="overview" className="pt-5">
                <OverviewTab report={report} onGotoTab={setTab} />
              </TabsPanel>
              <TabsPanel value="savings" className="pt-5">
                <SavingsTab report={report} onOpenStatement={setStatementFor} />
              </TabsPanel>
              <TabsPanel value="loans" className="pt-5">
                <LoansTab report={report} previous={prev} />
              </TabsPanel>
              <TabsPanel value="income" className="pt-5">
                <IncomeTab report={report} previous={prev} />
              </TabsPanel>
              <TabsPanel value="members" className="pt-5">
                <MembersTab report={report} onOpenStatement={setStatementFor} />
              </TabsPanel>
            </Tabs>

            <p className="text-sm text-muted-foreground/80">
              {periodLabel(report)}. Figures marked “Today” are as of today.
              Generated {new Date(report.generatedAt).toLocaleString("en-GB")}.
            </p>
          </div>
        ) : null}
      </QueryBoundary>

      {coopId ? (
        <MemberStatementDialog
          coopId={coopId}
          orgName={report?.cooperativeName ?? ""}
          member={statementMember}
          range={shownRange}
          onClose={() => setStatementFor(null)}
        />
      ) : null}
    </div>
  );
}
