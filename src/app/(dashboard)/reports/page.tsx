"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { FileSpreadsheet, FileText, Loader2 } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { useFinancialReport } from "@/hooks/use-financial-report";
import { useModuleAccess } from "@/hooks/use-permission";
import {
  exportFinancialReportExcel,
  exportFinancialReportPdf,
} from "@/lib/financial-report-export";
import { formatDateLong, formatMoney } from "@/lib/format";
import type { FinancialReport } from "@/services/report.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

const CHART_COLOR_VARS: CSSProperties = {
  "--chart-deposits": "light-dark(#1baf7a, #199e70)",
  "--chart-withdrawals": "light-dark(#eb6834, #d95926)",
  "--chart-loans": "light-dark(#4a3aa7, #9085e9)",
  "--chart-repayments": "light-dark(#0f766e, #2dd4bf)",
} as CSSProperties;

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

const PRESETS: { label: string; range: () => { from: string; to: string } }[] =
  [
    {
      label: "This month",
      range: () => {
        const now = new Date();
        return {
          from: isoDate(new Date(now.getFullYear(), now.getMonth(), 1)),
          to: isoDate(now),
        };
      },
    },
    {
      label: "This year",
      range: () => {
        const now = new Date();
        return { from: `${now.getFullYear()}-01-01`, to: isoDate(now) };
      },
    },
    {
      label: "Last 12 months",
      range: () => {
        const now = new Date();
        const start = new Date(now.getFullYear(), now.getMonth() - 11, 1);
        return { from: isoDate(start), to: isoDate(now) };
      },
    },
  ];

export default function ReportsPage() {
  const member = useAuthStore((state) => state.member);
  const access = useModuleAccess("Reports");
  const coopId = member?.cooperativeId ?? member?.id;
  const isCoopSide =
    member?.role === "admin" || member?.permissionModules != null;

  const [range, setRange] = useState(PRESETS[1].range);
  const { data, isLoading, isError, error, refetch, isFetching } =
    useFinancialReport(
      isCoopSide && access !== null ? coopId : undefined,
      range,
    );

  if (!member) return null;
  if (!isCoopSide || access === null) {
    return (
      <div className="pt-6">
        <p className="text-sm text-muted-foreground">
          You don&apos;t have access to financial reports.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-lg font-semibold text-foreground">
            Financial report
          </h1>
          <p className="text-sm text-muted-foreground">
            Savings, loans, repayments and income for your co-operative.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => {
              if (!data) return;
              try {
                exportFinancialReportExcel(data);
              } catch (err) {
                toast.error("Couldn't export", {
                  description: err instanceof Error ? err.message : undefined,
                });
              }
            }}
          >
            <FileSpreadsheet className="size-4" aria-hidden="true" />
            Excel
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={!data}
            onClick={() => {
              if (!data) return;
              try {
                exportFinancialReportPdf(data);
              } catch (err) {
                toast.error("Couldn't export", {
                  description: err instanceof Error ? err.message : undefined,
                });
              }
            }}
          >
            <FileText className="size-4" aria-hidden="true" />
            PDF
          </Button>
        </div>
      </div>

      <Card>
        <CardContent className="flex flex-wrap items-end gap-4">
          <div className="space-y-1.5">
            <Label htmlFor="report-from">From</Label>
            <Input
              id="report-from"
              type="date"
              value={range.from}
              max={range.to}
              onChange={(event) =>
                event.target.value &&
                setRange((r) => ({ ...r, from: event.target.value }))
              }
              className="h-10 w-40"
            />
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="report-to">To</Label>
            <Input
              id="report-to"
              type="date"
              value={range.to}
              min={range.from}
              onChange={(event) =>
                event.target.value &&
                setRange((r) => ({ ...r, to: event.target.value }))
              }
              className="h-10 w-40"
            />
          </div>
          <div className="flex flex-wrap gap-2">
            {PRESETS.map((preset) => {
              const presetRange = preset.range();
              const active =
                presetRange.from === range.from && presetRange.to === range.to;
              return (
                <Button
                  key={preset.label}
                  variant={active ? "secondary" : "ghost"}
                  size="sm"
                  onClick={() => setRange(presetRange)}
                >
                  {preset.label}
                </Button>
              );
            })}
          </div>
          {isFetching && data ? (
            <Loader2
              className="size-4 animate-spin text-muted-foreground"
              aria-label="Updating"
            />
          ) : null}
        </CardContent>
      </Card>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isFetching}
        errorTitle="Couldn't load the report"
      >
        {data ? <ReportBody report={data} /> : null}
      </QueryBoundary>
    </div>
  );
}

function ReportBody({ report }: { report: FinancialReport }) {
  const money = (value: number) => formatMoney(value, report.currency);
  const { savings, loans, income } = report;

  const chartData = useMemo(
    () =>
      report.monthly.map((m) => ({
        ...m,
        label: new Date(`${m.month}-01T00:00:00`).toLocaleDateString("en-GB", {
          month: "short",
          year: "2-digit",
        }),
      })),
    [report.monthly],
  );

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <Section
          title="Savings"
          rows={[
            [
              "Deposits",
              `${money(savings.deposits)} · ${savings.depositCount}`,
            ],
            [
              "Withdrawals",
              `${money(savings.withdrawals)} · ${savings.withdrawalCount}`,
            ],
            ["Taken for Within loans", money(savings.withinLoanDebits)],
            ["Returned from Within loans", money(savings.withinLoanCredits)],
            ["Net change", money(savings.netChange)],
          ]}
          total={["Total savings at period end", money(savings.closingBalance)]}
        />
        <Section
          title="Loans"
          rows={[
            ["Applications", String(loans.applications)],
            ["Paid out", `${loans.paidOut} · ${money(loans.principalPaidOut)}`],
            ["Paid to members (after charges)", money(loans.netPaidOut)],
            ["Rejected", String(loans.rejected)],
            [
              "Repayments collected",
              `${money(loans.repaymentsCollected)} · ${loans.repaymentCount}`,
            ],
            ["Active loans (today)", String(loans.activeLoans)],
          ]}
          total={["Outstanding (today)", money(loans.outstandingBalance)]}
          warning={
            loans.overdueLoans > 0
              ? `${loans.overdueLoans} overdue loan${loans.overdueLoans === 1 ? "" : "s"} · ${money(loans.overdueOutstanding)}`
              : undefined
          }
        />
        <Section
          title="Income"
          rows={[
            ["Interest earned", money(income.interestEarned)],
            ["Loan charges", money(income.loanCharges)],
            ["Savings charges", money(income.savingsCharges)],
            ["Withdrawal fees", money(income.withdrawalFees)],
          ]}
          total={["Total income", money(income.total)]}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Month by month</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-72 w-full" style={CHART_COLOR_VARS}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData} margin={{ left: 8, right: 8 }}>
                <CartesianGrid
                  vertical={false}
                  strokeDasharray="3 3"
                  className="stroke-border"
                />
                <XAxis
                  dataKey="label"
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                />
                <YAxis
                  tickLine={false}
                  axisLine={false}
                  fontSize={12}
                  width={72}
                  tickFormatter={(value: number) =>
                    new Intl.NumberFormat("en", { notation: "compact" }).format(
                      value,
                    )
                  }
                />
                <Tooltip formatter={(value) => money(Number(value))} />
                <Legend />
                <Bar
                  dataKey="deposits"
                  name="Deposits"
                  fill="var(--chart-deposits)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="withdrawals"
                  name="Withdrawals"
                  fill="var(--chart-withdrawals)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="loansPaidOut"
                  name="Loans paid out"
                  fill="var(--chart-loans)"
                  radius={[3, 3, 0, 0]}
                />
                <Bar
                  dataKey="repayments"
                  name="Repayments"
                  fill="var(--chart-repayments)"
                  radius={[3, 3, 0, 0]}
                />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 gap-4 xl:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>By loan type</CardTitle>
          </CardHeader>
          <CardContent>
            {report.byLoanType.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No loan activity in this period.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 font-medium">Loan type</th>
                      <th className="py-2 text-right font-medium">Paid out</th>
                      <th className="py-2 text-right font-medium">Principal</th>
                      <th className="py-2 text-right font-medium">Repaid</th>
                      <th className="py-2 text-right font-medium">
                        Outstanding
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.byLoanType.map((line) => (
                      <tr
                        key={line.loanType}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-2 font-medium text-foreground">
                          {line.loanType}
                        </td>
                        <td className="py-2 text-right">{line.loansPaidOut}</td>
                        <td className="py-2 text-right">
                          {money(line.principal)}
                        </td>
                        <td className="py-2 text-right">
                          {money(line.repaid)}
                        </td>
                        <td className="py-2 text-right">
                          {money(line.outstanding)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Overdue loans</CardTitle>
          </CardHeader>
          <CardContent>
            {report.overdue.length === 0 ? (
              <p className="text-sm text-muted-foreground">
                No loans are overdue.
              </p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full min-w-[480px] text-left text-sm">
                  <thead>
                    <tr className="border-b border-border text-muted-foreground">
                      <th className="py-2 font-medium">Member</th>
                      <th className="py-2 font-medium">Loan type</th>
                      <th className="py-2 text-right font-medium">
                        Outstanding
                      </th>
                      <th className="py-2 text-right font-medium">Overdue</th>
                    </tr>
                  </thead>
                  <tbody>
                    {report.overdue.map((loan) => (
                      <tr
                        key={loan.loanId}
                        className="border-b border-border last:border-0"
                      >
                        <td className="py-2">
                          <Link
                            href={`/loans/request/${loan.loanId}`}
                            className="font-medium text-primary underline-offset-4 hover:underline"
                          >
                            {loan.memberName}
                          </Link>
                        </td>
                        <td className="py-2">{loan.loanType}</td>
                        <td className="py-2 text-right">
                          {money(loan.outstanding)}
                        </td>
                        <td className="py-2 text-right text-destructive">
                          {loan.overdueInstallments} installment
                          {loan.overdueInstallments === 1 ? "" : "s"}
                          {loan.oldestDueDate
                            ? ` since ${formatDateLong(new Date(loan.oldestDueDate))}`
                            : ""}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <p className="text-xs text-muted-foreground">
        {formatDateLong(new Date(report.from))} –{" "}
        {formatDateLong(new Date(report.to))}. Outstanding and overdue figures
        are as of today. Generated{" "}
        {new Date(report.generatedAt).toLocaleString("en-GB")}.
      </p>
    </div>
  );
}

function Section({
  title,
  rows,
  total,
  warning,
}: {
  title: string;
  rows: [string, string][];
  total: [string, string];
  warning?: string;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <dl className="space-y-2 text-sm">
          {rows.map(([label, value]) => (
            <div
              key={label}
              className="flex items-center justify-between gap-4"
            >
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="text-right font-medium text-foreground">
                {value}
              </dd>
            </div>
          ))}
          <div className="flex items-center justify-between gap-4 border-t border-border pt-2">
            <dt className="font-medium text-foreground">{total[0]}</dt>
            <dd className="text-right text-base font-semibold text-foreground">
              {total[1]}
            </dd>
          </div>
        </dl>
        {warning ? (
          <p
            className={cn(
              "rounded-md bg-destructive/10 px-3 py-2 text-xs text-destructive",
            )}
          >
            {warning}
          </p>
        ) : null}
      </CardContent>
    </Card>
  );
}
