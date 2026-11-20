"use client";

import { useMemo, useState, type CSSProperties } from "react";
import Link from "next/link";
import { ArrowRight, CheckCircle2, PiggyBank } from "lucide-react";
import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";
import { Button } from "@/components/ui/button";
import { formatDateLong, formatMoney } from "@/lib/format";
import { monthLabel, parseIso } from "@/lib/report-periods";
import type { FinancialReport } from "@/services/report.service";
import { cn } from "@/lib/utils";
import {
  Delta,
  LedgerHead,
  LedgerRow,
  MemberCell,
  Panel,
  ReportTable,
  pct,
} from "./report-ui";

export type ReportTab = "overview" | "savings" | "loans" | "income" | "members";

const SERIES = [
  { key: "deposits", name: "Deposits", color: "var(--rp-deposits)" },
  { key: "withdrawals", name: "Withdrawals", color: "var(--rp-withdrawals)" },
  { key: "loansPaidOut", name: "Loans paid out", color: "var(--rp-loans)" },
  { key: "repayments", name: "Repayments", color: "var(--rp-repayments)" },
  { key: "income", name: "Income", color: "var(--rp-income)" },
] as const;
type SeriesKey = (typeof SERIES)[number]["key"];

export const REPORT_COLORS: CSSProperties = {
  "--rp-deposits": "light-dark(#3a9a6a, #5cc48d)",
  "--rp-withdrawals": "light-dark(#b86e0c, #e3a249)",
  "--rp-loans": "light-dark(#6a48dc, #a68ef3)",
  "--rp-repayments": "light-dark(#2f73cc, #74a8ee)",
  "--rp-income": "light-dark(#1f4d3b, #6cc497)",
} as CSSProperties;

const compact = (value: number, currency: string) => {
  const symbol = formatMoney(0, currency).replace(/[\d.,\s]/g, "");
  const abs = Math.abs(value);
  const short =
    abs >= 1e6
      ? `${+(value / 1e6).toFixed(1)}m`
      : abs >= 1e3
        ? `${+(value / 1e3).toFixed(1)}k`
        : String(Math.round(value));
  return `${symbol}${short}`;
};

/* ---------------- Overview ---------------- */

export function OverviewTab({
  report: r,
  onGotoTab,
}: {
  report: FinancialReport;
  onGotoTab: (tab: ReportTab) => void;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const [hidden, setHidden] = useState<Set<SeriesKey>>(new Set(["income"]));
  const [asTable, setAsTable] = useState(false);
  const data = useMemo(
    () => r.monthly.map((m) => ({ ...m, label: monthLabel(m.month) })),
    [r.monthly],
  );
  const visible = SERIES.filter((s) => !hidden.has(s.key));
  const toggle = (key: SeriesKey) =>
    setHidden((current) => {
      const next = new Set(current);
      if (next.has(key)) next.delete(key);
      else if (next.size < SERIES.length - 1) next.add(key); // keep at least one
      return next;
    });

  const fees = r.income.savingsCharges + r.income.withdrawalFees;
  const moneyIn =
    r.savings.deposits +
    r.loans.repaymentsCollected +
    r.income.applicationFees +
    r.income.loanCharges +
    fees;
  const moneyOut = r.savings.withdrawals + r.loans.principalPaidOut;
  const net = moneyIn - moneyOut;

  return (
    <div className="space-y-5">
      <Panel
        title="Month by month"
        aside={
          <div className="flex flex-wrap items-center gap-1.5">
            {!asTable ? (
              <div
                className="flex flex-wrap gap-1"
                role="group"
                aria-label="Show or hide series"
              >
                {SERIES.map((s) => (
                  <button
                    key={s.key}
                    type="button"
                    aria-pressed={!hidden.has(s.key)}
                    onClick={() => toggle(s.key)}
                    className={cn(
                      "inline-flex h-8 items-center gap-2 rounded-full px-3 text-sm font-semibold hover:bg-muted",
                      hidden.has(s.key)
                        ? "text-muted-foreground/60"
                        : "text-muted-foreground",
                    )}
                  >
                    <span
                      className="size-2.5 rounded-[3px]"
                      style={
                        hidden.has(s.key)
                          ? { boxShadow: "inset 0 0 0 1.5px currentColor" }
                          : { background: s.color }
                      }
                    />
                    {s.name}
                  </button>
                ))}
              </div>
            ) : null}
            <Button
              variant="ghost"
              size="sm"
              aria-pressed={asTable}
              onClick={() => setAsTable((v) => !v)}
            >
              {asTable ? "Show as chart" : "Show as table"}
            </Button>
          </div>
        }
      >
        {asTable ? (
          <div className="mt-4">
            <ReportTable
              rows={data}
              rowKey={(m) => m.month}
              pageSize={24}
              empty="No months in this period."
              columns={[
                {
                  key: "m",
                  label: "Month",
                  render: (m) => <b className="text-foreground">{m.label}</b>,
                },
                ...SERIES.map((s) => ({
                  key: s.key,
                  label: s.name,
                  numeric: true,
                  render: (m: (typeof data)[number]) => money(m[s.key]),
                })),
              ]}
            />
          </div>
        ) : (
          <div className="mt-4 h-[300px] sm:h-[340px]" style={REPORT_COLORS}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={data}
                margin={{ left: 0, right: 4, top: 8 }}
                barCategoryGap="20%"
              >
                <CartesianGrid vertical={false} className="stroke-border" />
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
                  width={60}
                  tickFormatter={(value: number) => compact(value, r.currency)}
                />
                <Tooltip
                  cursor={{ className: "fill-muted" }}
                  formatter={(value, name) => [money(Number(value)), name]}
                  contentStyle={{
                    borderRadius: 12,
                    border: "1px solid var(--border)",
                    background: "var(--card)",
                    fontSize: 13,
                  }}
                />
                {visible.map((s) => (
                  <Bar
                    key={s.key}
                    dataKey={s.key}
                    name={s.name}
                    fill={s.color}
                    radius={[3, 3, 0, 0]}
                    maxBarSize={28}
                  />
                ))}
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </Panel>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Panel title="Money in and out">
          <div className="mt-3">
            <LedgerHead>Money in</LedgerHead>
            <LedgerRow label="Deposits" value={money(r.savings.deposits)} />
            <LedgerRow
              label="Loan repayments"
              value={money(r.loans.repaymentsCollected)}
            />
            <LedgerRow
              label="Application fees"
              value={money(r.income.applicationFees)}
            />
            {r.income.loanCharges > 0 ? (
              <LedgerRow
                label="Loan charges"
                value={money(r.income.loanCharges)}
              />
            ) : null}
            <LedgerRow
              label="Charges and withdrawal fees"
              value={money(fees)}
            />
            <LedgerRow
              label="Total in"
              value={money(moneyIn)}
              variant="total"
            />
            <LedgerHead>Money out</LedgerHead>
            <LedgerRow
              label="Withdrawals"
              value={money(r.savings.withdrawals)}
            />
            <LedgerRow
              label="Loans paid out"
              value={money(r.loans.principalPaidOut)}
            />
            <LedgerRow
              label="Total out"
              value={money(moneyOut)}
              variant="total"
            />
            <LedgerRow
              label="Net cash flow"
              variant="grand"
              value={
                <span
                  className={
                    net >= 0
                      ? "text-emerald-600 dark:text-emerald-400"
                      : "text-destructive"
                  }
                >
                  {net >= 0 ? "+" : "−"}
                  {money(Math.abs(net))}
                </span>
              }
            />
          </div>
        </Panel>
        <Panel title="Needs attention">
          <p className="mt-0.5 text-sm text-muted-foreground">As of today</p>
          <Attention report={r} onGotoTab={onGotoTab} />
        </Panel>
      </div>
    </div>
  );
}

function Attention({
  report: r,
  onGotoTab,
}: {
  report: FinancialReport;
  onGotoTab: (tab: ReportTab) => void;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const items: {
    tone: "danger" | "violet" | "warning" | "neutral";
    text: string;
    href?: string;
    tab?: ReportTab;
  }[] = [];
  const od = r.overdue;
  if (od.length) {
    items.push({
      tone: "danger",
      text: `${od.length} overdue ${od.length === 1 ? "loan" : "loans"} · ${money(od.reduce((s, o) => s + o.amountDue, 0))} past due`,
      tab: "loans",
    });
  }
  const pd = r.loans.pendingDisbursement;
  if (pd) {
    items.push({
      tone: "violet",
      text: `${pd} ${pd === 1 ? "loan is" : "loans are"} approved and waiting to be paid out`,
      href: r.loans.firstPendingDisbursementId
        ? `/loans/request/${r.loans.firstPendingDisbursementId}`
        : "/loans",
    });
  }
  const waiting = r.loans.inProgress - pd;
  if (waiting > 0) {
    items.push({
      tone: "warning",
      text: `${waiting} loan ${waiting === 1 ? "request is" : "requests are"} waiting for guarantors or approval`,
      href: "/loans",
    });
  }
  const now = Date.now();
  const quiet = r.members.filter(
    (m) =>
      !m.lastDeposit ||
      (now - parseIso(m.lastDeposit).getTime()) / 86_400_000 > 45,
  ).length;
  if (quiet) {
    items.push({
      tone: "neutral",
      text: `${quiet} ${quiet === 1 ? "member hasn’t" : "members haven’t"} saved in over 45 days`,
      tab: "members",
    });
  }

  if (!items.length) {
    return (
      <div className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-foreground">
        <CheckCircle2
          className="mt-px size-4 text-emerald-600"
          aria-hidden="true"
        />
        Nothing needs attention right now.
      </div>
    );
  }
  const dot = {
    danger: "bg-destructive",
    violet: "bg-violet-500",
    warning: "bg-amber-500",
    neutral: "bg-muted-foreground/50",
  };
  const cta =
    "inline-flex items-center gap-1.5 text-sm font-bold text-primary hover:[&>svg]:translate-x-0.5";
  return (
    <ul className="mt-3.5 grid gap-2.5">
      {items.map((item) => (
        <li
          key={item.text}
          className="flex items-center gap-3 rounded-xl border border-border px-3.5 py-3 text-foreground"
        >
          <span
            className={cn("size-2.5 shrink-0 rounded-full", dot[item.tone])}
          />
          <span className="flex-1 text-sm">{item.text}</span>
          {item.href ? (
            <Link href={item.href} className={cta}>
              Open{" "}
              <ArrowRight
                className="size-4 transition-transform"
                aria-hidden="true"
              />
            </Link>
          ) : (
            <button
              type="button"
              className={cta}
              onClick={() => item.tab && onGotoTab(item.tab)}
            >
              View{" "}
              <ArrowRight
                className="size-4 transition-transform"
                aria-hidden="true"
              />
            </button>
          )}
        </li>
      ))}
    </ul>
  );
}

/* ---------------- Savings ---------------- */

export function SavingsTab({
  report: r,
  onOpenStatement,
}: {
  report: FinancialReport;
  onOpenStatement: (memberId: string) => void;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const s = r.savings;
  const charges = r.income.savingsCharges + r.income.withdrawalFees;
  const total = r.members.reduce((sum, m) => sum + m.closing, 0) || 1;
  const small = (text: string) => (
    <small className="block text-xs text-muted-foreground/80">{text}</small>
  );

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Panel title="Savings for the period">
          <div className="mt-3">
            <LedgerRow
              label={`Balance on ${formatDateLong(parseIso(r.from))}`}
              value={money(s.openingBalance)}
            />
            <LedgerRow
              label={
                <>
                  Deposits
                  {small(
                    `${s.depositCount} from ${s.savers} ${s.savers === 1 ? "member" : "members"}`,
                  )}
                </>
              }
              value={`+${money(s.deposits)}`}
            />
            <LedgerRow
              label={<>Withdrawals{small(String(s.withdrawalCount))}</>}
              value={`−${money(s.withdrawals)}`}
            />
            <LedgerRow
              label="Charges and withdrawal fees"
              value={`−${money(charges)}`}
            />
            <LedgerRow
              label={`Balance on ${formatDateLong(parseIso(r.to))}`}
              value={money(s.closingBalance)}
              variant="grand"
            />
          </div>
          {s.withinLoanDebits || s.withinLoanCredits ? (
            <p className="mt-3.5 flex items-start gap-2.5 rounded-xl border border-border bg-muted/40 px-3.5 py-3 text-sm text-foreground">
              <PiggyBank
                className="mt-px size-4 shrink-0 text-emerald-600"
                aria-hidden="true"
              />
              <span>
                Within loans: {money(s.withinLoanDebits)} lent out of members’
                own savings this period, {money(s.withinLoanCredits)} paid back
                into them.
              </span>
            </p>
          ) : null}
        </Panel>
        <Panel title="By month">
          <div className="mt-3.5">
            <ReportTable
              rows={r.monthly}
              rowKey={(m) => m.month}
              pageSize={12}
              compact
              minWidth={0}
              empty="No months in this period."
              columns={[
                {
                  key: "m",
                  label: "Month",
                  render: (m) => monthLabel(m.month),
                },
                {
                  key: "d",
                  label: "Deposits",
                  numeric: true,
                  render: (m) => money(m.deposits),
                },
                {
                  key: "w",
                  label: "Withdrawals",
                  numeric: true,
                  render: (m) => money(m.withdrawals),
                },
                {
                  key: "b",
                  label: "Balance",
                  numeric: true,
                  render: (m) => (
                    <b className="text-foreground">{money(m.closingBalance)}</b>
                  ),
                },
              ]}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="Savings by member"
        aside={
          <span className="text-sm text-muted-foreground">
            Balances at the end of the period
          </span>
        }
      >
        <div className="mt-3.5">
          <ReportTable
            rows={r.members}
            rowKey={(m) => m.memberId}
            onRowClick={(m) => onOpenStatement(m.memberId)}
            minWidth={820}
            empty="No members yet."
            columns={[
              {
                key: "m",
                label: "Member",
                render: (m) => (
                  <MemberCell
                    name={m.name}
                    meta={m.memberId}
                    url={m.avatarUrl}
                  />
                ),
              },
              {
                key: "o",
                label: "Opening",
                numeric: true,
                render: (m) => money(m.opening),
              },
              {
                key: "d",
                label: "Deposits",
                numeric: true,
                render: (m) => money(m.deposits),
              },
              {
                key: "w",
                label: "Withdrawals",
                numeric: true,
                render: (m) => money(m.withdrawals),
              },
              {
                key: "c",
                label: "Closing",
                numeric: true,
                render: (m) => (
                  <b className="text-foreground">{money(m.closing)}</b>
                ),
              },
              {
                key: "s",
                label: "Share",
                render: (m) => (
                  <span className="inline-flex items-center gap-2 text-sm whitespace-nowrap">
                    <span className="h-1.5 w-16 overflow-hidden rounded-full bg-muted">
                      <i
                        className="block h-full bg-[#3a9a6a]"
                        style={{
                          width: `${Math.max(0, (m.closing / total) * 100).toFixed(1)}%`,
                        }}
                      />
                    </span>
                    {pct(m.closing / total, 1)}
                  </span>
                ),
              },
              {
                key: "l",
                label: "Last deposit",
                className: "whitespace-nowrap",
                render: (m) =>
                  m.lastDeposit ? (
                    formatDateLong(parseIso(m.lastDeposit))
                  ) : (
                    <span className="text-muted-foreground/70">Never</span>
                  ),
              },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Income ---------------- */

export function IncomeTab({
  report: r,
  previous: p,
}: {
  report: FinancialReport;
  previous: FinancialReport | null;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const i = r.income;
  const rows: [string, number, number | undefined, string][] = [
    [
      "Interest earned",
      i.interestEarned,
      p?.income.interestEarned,
      "var(--rp-deposits)",
    ],
    [
      "Loan application fees",
      i.applicationFees,
      p?.income.applicationFees,
      "var(--rp-loans)",
    ],
    [
      "Savings charges",
      i.savingsCharges,
      p?.income.savingsCharges,
      "var(--rp-repayments)",
    ],
    [
      "Withdrawal fees",
      i.withdrawalFees,
      p?.income.withdrawalFees,
      "var(--rp-withdrawals)",
    ],
  ];
  if (i.loanCharges > 0 || (p?.income.loanCharges ?? 0) > 0) {
    rows.splice(2, 0, [
      "Loan charges",
      i.loanCharges,
      p?.income.loanCharges,
      "var(--rp-income)",
    ]);
  }

  return (
    <div
      className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2"
      style={REPORT_COLORS}
    >
      <Panel title="Where income came from">
        <div className="mt-3.5 grid gap-3.5">
          {rows.map(([label, value, before, color]) => (
            <div key={label}>
              <div className="flex justify-between gap-3 text-muted-foreground">
                <span>{label}</span>
                <b className="text-foreground">{money(value)}</b>
              </div>
              <div className="mt-1.5 h-2 overflow-hidden rounded-full bg-muted">
                <i
                  className="block h-full rounded-full"
                  style={{
                    width: `${i.total ? (value / i.total) * 100 : 0}%`,
                    background: color,
                  }}
                />
              </div>
              <div className="mt-1.5 flex items-center gap-2 text-xs text-muted-foreground/80">
                {i.total ? pct(value / i.total) : "0%"} of income
                <Delta now={value} before={p ? before : null} />
              </div>
            </div>
          ))}
          <div className="mt-1.5 flex items-baseline justify-between gap-3 pt-3.5 text-base font-bold text-foreground">
            <span>Total income</span>
            <b className="flex items-center gap-2 text-lg">
              {money(i.total)} <Delta now={i.total} before={p?.income.total} />
            </b>
          </div>
        </div>
        <p className="mt-3.5 text-sm text-muted-foreground/80">
          Interest is counted as repayments come in, not when a loan is paid
          out.
        </p>
      </Panel>
      <Panel title="By month">
        <div className="mt-3.5">
          <ReportTable
            rows={r.monthly}
            rowKey={(m) => m.month}
            pageSize={12}
            compact
            minWidth={0}
            empty="No months in this period."
            columns={[
              { key: "m", label: "Month", render: (m) => monthLabel(m.month) },
              {
                key: "i",
                label: "Interest",
                numeric: true,
                render: (m) => money(m.interest),
              },
              {
                key: "f",
                label: "Fees and charges",
                numeric: true,
                render: (m) => money(m.fees),
              },
              {
                key: "t",
                label: "Total",
                numeric: true,
                render: (m) => (
                  <b className="text-foreground">{money(m.income)}</b>
                ),
              },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}
