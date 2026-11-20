"use client";

import { Download, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useMemberStatement } from "@/hooks/use-financial-report";
import {
  exportStatementCsv,
  exportStatementPdf,
} from "@/lib/financial-report-export";
import { formatDateLong, formatMoney } from "@/lib/format";
import { parseIso, periodLabel } from "@/lib/report-periods";
import type { ReportMember } from "@/services/report.service";
import { cn } from "@/lib/utils";
import { Avatar, Pill, ReportTable } from "./report-ui";

export function MemberStatementDialog({
  coopId,
  orgName,
  member,
  range,
  onClose,
}: {
  coopId: string;
  orgName: string;
  member: ReportMember | null;
  range: { from: string; to: string };
  onClose: () => void;
}) {
  const { data, isLoading, isError } = useMemberStatement(
    coopId,
    member?.memberId ?? null,
    range,
  );
  const money = (value: number) => formatMoney(value, data?.currency ?? "NGN");
  const paidIn = data
    ? data.savingsRows
        .filter((r) => r.amount > 0)
        .reduce((s, r) => s + r.amount, 0)
    : 0;
  const takenOut = data
    ? -data.savingsRows
        .filter((r) => r.amount < 0)
        .reduce((s, r) => s + r.amount, 0)
    : 0;
  const when = (value: string) => formatDateLong(parseIso(value));
  const run = (fn: () => void) => {
    try {
      fn();
      toast.success("Statement downloaded.");
    } catch (err) {
      toast.error("Couldn't build the statement", {
        description: err instanceof Error ? err.message : undefined,
      });
    }
  };

  return (
    <Dialog open={member != null} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        {member ? (
          <DialogHeader>
            <div className="flex items-center gap-3">
              <Avatar name={member.name} url={member.avatarUrl} />
              <div className="min-w-0">
                <DialogTitle>{member.name}</DialogTitle>
                <DialogDescription>
                  {member.memberId} · Statement for {periodLabel(range)}
                </DialogDescription>
              </div>
            </div>
          </DialogHeader>
        ) : null}

        {isLoading ? (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-muted-foreground">
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            Loading statement…
          </div>
        ) : isError || !data ? (
          <p className="py-12 text-center text-sm text-muted-foreground">
            We couldn&apos;t load this statement. Close it and try again.
          </p>
        ) : (
          <div className="min-w-0">
            <div className="grid grid-cols-2 gap-2.5 md:grid-cols-5">
              {[
                ["Opening savings", money(data.opening), ""],
                [
                  "Paid in",
                  `+${money(paidIn)}`,
                  "text-emerald-600 dark:text-emerald-400",
                ],
                ["Taken out", `−${money(takenOut)}`, ""],
                ["Closing savings", money(data.closing), ""],
                ["Owes on loans today", money(data.owesToday), ""],
              ].map(([label, value, tone]) => (
                <div
                  key={label}
                  className="rounded-xl border border-border bg-muted/40 px-3.5 py-3"
                >
                  <span className="block text-xs font-semibold text-muted-foreground/80">
                    {label}
                  </span>
                  <b className={cn("text-base text-foreground", tone)}>
                    {value}
                  </b>
                </div>
              ))}
            </div>

            <h4 className="mt-5 mb-2.5 font-bold text-foreground">Savings</h4>
            <ReportTable
              rows={data.savingsRows}
              rowKey={(r) => `${r.date}-${r.reference}-${r.balance}`}
              pageSize={8}
              compact
              minWidth={600}
              empty="No savings activity in this period."
              columns={[
                {
                  key: "d",
                  label: "Date",
                  className: "whitespace-nowrap",
                  render: (r) => when(r.date),
                },
                {
                  key: "t",
                  label: "Type",
                  render: (r) => (
                    <Pill
                      tone={
                        r.type === "Deposit"
                          ? "success"
                          : r.type === "Withdrawal"
                            ? "warning"
                            : "neutral"
                      }
                    >
                      {r.type}
                    </Pill>
                  ),
                },
                { key: "x", label: "Details", render: (r) => r.details },
                {
                  key: "a",
                  label: "Amount",
                  numeric: true,
                  render: (r) => (
                    <span
                      className={cn(
                        "font-semibold",
                        r.amount > 0
                          ? "text-emerald-600 dark:text-emerald-400"
                          : "text-foreground",
                      )}
                    >
                      {r.amount > 0 ? "+" : "−"}
                      {money(Math.abs(r.amount))}
                    </span>
                  ),
                },
                {
                  key: "b",
                  label: "Balance",
                  numeric: true,
                  render: (r) => money(r.balance),
                },
              ]}
            />

            <h4 className="mt-5 mb-2.5 font-bold text-foreground">
              Loan activity
            </h4>
            <ReportTable
              rows={data.loanRows}
              rowKey={(r) => `${r.loanId}-${r.date}-${r.reference}-${r.amount}`}
              pageSize={8}
              compact
              minWidth={480}
              empty="No loan activity in this period."
              columns={[
                {
                  key: "d",
                  label: "Date",
                  className: "whitespace-nowrap",
                  render: (r) => when(r.date),
                },
                { key: "x", label: "Details", render: (r) => r.details },
                {
                  key: "a",
                  label: "Amount",
                  numeric: true,
                  render: (r) => (
                    <span className="font-semibold text-foreground">
                      {r.amount > 0
                        ? `Paid out ${money(r.amount)}`
                        : `Repaid ${money(-r.amount)}`}
                    </span>
                  ),
                },
              ]}
            />
          </div>
        )}

        <DialogFooter>
          <Button
            variant="outline"
            disabled={!data}
            onClick={() => data && run(() => exportStatementCsv(data))}
          >
            <Download className="size-4" aria-hidden="true" />
            Statement (CSV)
          </Button>
          <Button
            disabled={!data}
            onClick={() => data && run(() => exportStatementPdf(data, orgName))}
          >
            <Download className="size-4" aria-hidden="true" />
            Statement (PDF)
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
