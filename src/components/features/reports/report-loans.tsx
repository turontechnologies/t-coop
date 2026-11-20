"use client";

import { useState, type ReactNode } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ChevronRight, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { formatDateLong, formatMoney } from "@/lib/format";
import { parseIso } from "@/lib/report-periods";
import type { FinancialReport } from "@/services/report.service";
import { cn } from "@/lib/utils";
import { par30Rate } from "./report-kpis";
import {
  Delta,
  MemberCell,
  Panel,
  Pill,
  ReportTable,
  StackBar,
  TodayTag,
  pct,
} from "./report-ui";

const AGEING_COLORS = [
  "light-dark(#3a9a6a, #5cc48d)",
  "light-dark(#b86e0c, #e3a249)",
  "#e07b39",
  "light-dark(#cf3f3f, #ef7a7a)",
  "#8f1d1d",
];

function interestText(
  type: FinancialReport["byLoanType"][number],
  money: (value: number) => string,
) {
  if (!type.interestType || type.interestType === "NoInterest")
    return "No interest";
  if (type.interestType === "Fixed") return money(type.interestAmount);
  return `${type.interestAmount}%`;
}

function PipelineStep({
  label,
  count,
  amount,
  delta,
  tone,
}: {
  label: string;
  count: number;
  amount: string;
  delta: ReactNode;
  tone: "neutral" | "warning" | "success" | "danger";
}) {
  return (
    <div
      className={cn(
        "grid content-start gap-0.5 rounded-2xl border border-t-4 border-border p-4",
        tone === "neutral" && "border-t-foreground/20",
        tone === "warning" && "border-t-amber-500",
        tone === "success" && "border-t-emerald-500",
        tone === "danger" && "border-t-destructive",
      )}
    >
      <span className="text-sm font-semibold text-muted-foreground">
        {label}
      </span>
      <b className="text-2xl leading-tight font-bold text-foreground">
        {count}
      </b>
      <span className="mb-1.5 text-sm text-muted-foreground">{amount}</span>
      <span className="justify-self-start">{delta}</span>
    </div>
  );
}

export function LoansTab({
  report: r,
  previous: p,
}: {
  report: FinancialReport;
  previous: FinancialReport | null;
}) {
  const router = useRouter();
  const money = (value: number) => formatMoney(value, r.currency);
  const l = r.loans;
  const pl = p?.loans;
  const ageingTotal = r.ageing.reduce((sum, b) => sum + b.amount, 0);
  const rate = par30Rate(r);

  return (
    <div className="space-y-5">
      <Panel
        title="Loan activity in the period"
        aside={
          <Link href="/loans" className="text-sm font-bold text-primary">
            Open loans
          </Link>
        }
      >
        <div className="mt-4 grid grid-cols-2 gap-3 md:grid-cols-4">
          <PipelineStep
            label="Applied"
            count={l.applications}
            amount={`${money(l.appliedAmount)} requested`}
            delta={<Delta now={l.applications} before={pl?.applications} />}
            tone="neutral"
          />
          <PipelineStep
            label="Fully approved"
            count={l.approved}
            amount={money(l.approvedAmount)}
            delta={<Delta now={l.approved} before={pl?.approved} />}
            tone="warning"
          />
          <PipelineStep
            label="Paid out"
            count={l.paidOut}
            amount={money(l.principalPaidOut)}
            delta={
              <Delta now={l.principalPaidOut} before={pl?.principalPaidOut} />
            }
            tone="success"
          />
          <PipelineStep
            label="Rejected"
            count={l.rejected}
            amount=" "
            delta={<Delta now={l.rejected} before={pl?.rejected} invert />}
            tone="danger"
          />
          <p className="col-span-full text-sm text-muted-foreground">
            {l.inProgress} {l.inProgress === 1 ? "request is" : "requests are"}{" "}
            still in progress today
            {l.pendingDisbursement
              ? `, ${l.pendingDisbursement} waiting to be paid out`
              : ""}
            .
          </p>
        </div>
      </Panel>

      <div className="grid grid-cols-1 items-start gap-5 xl:grid-cols-2">
        <Panel title="Portfolio at risk" aside={<TodayTag />}>
          <div className="mt-3 flex items-end justify-between gap-3">
            <div>
              <span className="text-sm text-muted-foreground">
                Over 30 days late
              </span>
              <div
                className={cn(
                  "text-[2.5rem] leading-tight font-bold text-foreground",
                  rate > 0.1 && "text-destructive",
                )}
              >
                {pct(rate, 1)}
              </div>
            </div>
            <div className="text-right text-sm text-muted-foreground">
              {money(l.par30Amount)} of {money(ageingTotal)}
              <br />
              outstanding
            </div>
          </div>
          <StackBar
            className="mt-3.5 h-3"
            label="Outstanding by days late"
            parts={r.ageing.map((b, i) => ({
              value: b.amount,
              color: AGEING_COLORS[i],
            }))}
          />
          <table className="mt-3.5 w-full text-sm">
            <tbody>
              {r.ageing.map((b, i) => (
                <tr
                  key={b.name}
                  className="border-b border-border text-muted-foreground last:border-0"
                >
                  <td className="py-2">
                    <i
                      className="mr-2 inline-block size-2.5 rounded-[3px] align-[-1px]"
                      style={{ background: AGEING_COLORS[i] }}
                    />
                    {b.name}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    {b.count} {b.count === 1 ? "loan" : "loans"}
                  </td>
                  <td className="py-2 pl-3 text-right">
                    <b className="text-foreground">{money(b.amount)}</b>
                  </td>
                  <td className="py-2 pl-3 text-right text-muted-foreground/70">
                    {ageingTotal ? pct(b.amount / ageingTotal) : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </Panel>

        <Panel title="Overdue loans" aside={<TodayTag />}>
          <div className="mt-3.5">
            <ReportTable
              rows={r.overdue}
              rowKey={(o) => o.loanId}
              onRowClick={(o) => router.push(`/loans/${o.loanId}`)}
              pageSize={6}
              minWidth={0}
              empty="No loans are overdue."
              columns={[
                {
                  key: "m",
                  label: "Member",
                  render: (o) => (
                    <>
                      <b className="text-foreground">{o.memberName}</b>
                      <div className="text-sm">{o.loanType}</div>
                    </>
                  ),
                },
                {
                  key: "l",
                  label: "Late",
                  className: "whitespace-nowrap",
                  render: (o) => (
                    <Pill
                      tone={
                        o.daysLate > 60
                          ? "danger"
                          : o.daysLate > 30
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {o.daysLate} days
                    </Pill>
                  ),
                },
                {
                  key: "d",
                  label: "Past due",
                  numeric: true,
                  render: (o) => (
                    <>
                      <b className="text-foreground">{money(o.amountDue)}</b>
                      <div className="text-xs">
                        {o.overdueInstallments}{" "}
                        {o.overdueInstallments === 1
                          ? "instalment"
                          : "instalments"}
                      </div>
                    </>
                  ),
                },
                {
                  key: "o",
                  label: "Outstanding",
                  numeric: true,
                  render: (o) => money(o.outstanding),
                },
              ]}
            />
          </div>
        </Panel>
      </div>

      <Panel
        title="By loan type"
        aside={
          <span className="text-sm text-muted-foreground">
            Paid out, repaid and interest in the period · outstanding and
            overdue today
          </span>
        }
      >
        <div className="mt-3.5">
          <ReportTable
            rows={r.byLoanType}
            rowKey={(t) => t.loanTypeId ?? t.loanType}
            onRowClick={(t) =>
              router.push(`/loans/type/${encodeURIComponent(t.loanType)}`)
            }
            minWidth={860}
            empty="No loan types yet."
            columns={[
              {
                key: "t",
                label: "Loan type",
                render: (t) => (
                  <>
                    <b className="text-foreground">{t.loanType}</b>
                    <div className="text-sm">
                      {t.months ? `${t.months} months · ` : ""}
                      {interestText(t, money)}
                    </div>
                  </>
                ),
              },
              {
                key: "a",
                label: "Applications",
                numeric: true,
                render: (t) => t.applications,
              },
              {
                key: "p",
                label: "Paid out",
                numeric: true,
                render: (t) => money(t.principal),
              },
              {
                key: "r",
                label: "Repaid",
                numeric: true,
                render: (t) => money(t.repaid),
              },
              {
                key: "i",
                label: "Interest earned",
                numeric: true,
                render: (t) => money(t.interest),
              },
              {
                key: "o",
                label: "Outstanding",
                numeric: true,
                render: (t) => (
                  <b className="text-foreground">{money(t.outstanding)}</b>
                ),
              },
              {
                key: "d",
                label: "Overdue",
                numeric: true,
                render: (t) =>
                  t.overdue ? (
                    <span className="font-semibold text-destructive">
                      {money(t.overdue)}
                    </span>
                  ) : (
                    money(0)
                  ),
              },
            ]}
          />
        </div>
      </Panel>
    </div>
  );
}

/* ---------------- Members ---------------- */

export function MembersTab({
  report: r,
  onOpenStatement,
}: {
  report: FinancialReport;
  onOpenStatement: (memberId: string) => void;
}) {
  const money = (value: number) => formatMoney(value, r.currency);
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();
  const rows = r.members.filter(
    (m) => !q || `${m.name} ${m.memberId}`.toLowerCase().includes(q),
  );
  const none = (text: string) => (
    <span className="text-muted-foreground/70">{text}</span>
  );

  return (
    <Panel
      title="Members"
      aside={
        <div className="relative w-full min-w-[200px] sm:w-[280px]">
          <Search
            className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            placeholder="Search members"
            aria-label="Search members"
            className="h-11 rounded-xl pl-10"
          />
        </div>
      }
    >
      <p className="mt-1 text-sm text-muted-foreground">
        Click a member for their statement for this period.
      </p>
      <div className="mt-3.5">
        <ReportTable
          rows={rows}
          rowKey={(m) => m.memberId}
          onRowClick={(m) => onOpenStatement(m.memberId)}
          pageSizes={[10, 25, 50]}
          minWidth={960}
          empty={
            q ? "No members found. Try a different search." : "No members yet."
          }
          columns={[
            {
              key: "m",
              label: "Member",
              render: (m) => (
                <MemberCell
                  name={m.name}
                  meta={`${m.memberId} · ${m.role}`}
                  url={m.avatarUrl}
                />
              ),
            },
            {
              key: "s",
              label: "Savings",
              numeric: true,
              render: (m) => (
                <b className="text-foreground">{money(m.closing)}</b>
              ),
            },
            {
              key: "d",
              label: "Deposited",
              numeric: true,
              render: (m) => money(m.deposits),
            },
            {
              key: "o",
              label: "Owes",
              numeric: true,
              render: (m) =>
                m.outstanding ? (
                  <>
                    {money(m.outstanding)}
                    {m.overdueInstallments ? (
                      <div className="mt-1">
                        <Pill tone="danger">{m.overdueInstallments} late</Pill>
                      </div>
                    ) : null}
                  </>
                ) : (
                  none("—")
                ),
            },
            {
              key: "t",
              label: "On-time repayments",
              className: "whitespace-nowrap",
              render: (m) =>
                m.onTimeRate == null
                  ? none("No repayments")
                  : `${m.onTimeRate}%`,
            },
            {
              key: "a",
              label: "Attendance",
              className: "whitespace-nowrap",
              render: (m) =>
                m.attendanceRate == null ? none("—") : `${m.attendanceRate}%`,
            },
            {
              key: "l",
              label: "Last activity",
              className: "whitespace-nowrap",
              render: (m) =>
                m.lastActivity
                  ? formatDateLong(parseIso(m.lastActivity))
                  : none("None"),
            },
            {
              key: "go",
              label: "",
              className: "w-10",
              render: () => (
                <ChevronRight
                  className="size-4 text-muted-foreground/70"
                  aria-hidden="true"
                />
              ),
            },
          ]}
        />
      </div>
    </Panel>
  );
}
