"use client";

import { useMemo, useState } from "react";
import { Info } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useCoopEarnings,
  usePlatformEarnings,
} from "@/hooks/use-platform-earnings";
import { formatDateTime, formatNaira } from "@/lib/format";
import {
  EARNING_SOURCE_LABELS,
  type CoopEarnings,
  type EarningSource,
} from "@/lib/settings-data";

const SOURCES = Object.keys(EARNING_SOURCE_LABELS) as EarningSource[];

const PERIODS = {
  thisMonth: "This month",
  lastMonth: "Last month",
  last3Months: "Last 3 months",
  thisYear: "This year",
  allTime: "All time",
} as const;

type Period = keyof typeof PERIODS;

function iso(date: Date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

function rangeFor(period: Period): { from: string; to: string } {
  const now = new Date();
  switch (period) {
    case "lastMonth":
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 1, 1)),
        to: iso(new Date(now.getFullYear(), now.getMonth(), 0)),
      };
    case "last3Months":
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth() - 2, 1)),
        to: iso(now),
      };
    case "thisYear":
      return { from: iso(new Date(now.getFullYear(), 0, 1)), to: iso(now) };
    case "allTime":
      return { from: "2020-01-01", to: iso(now) };
    default:
      return {
        from: iso(new Date(now.getFullYear(), now.getMonth(), 1)),
        to: iso(now),
      };
  }
}

/** Super admin: what the platform earned from each co-operative, and from what. */
export function PlatformEarningsPanel() {
  const [period, setPeriod] = useState<Period>("thisMonth");
  const { from, to } = useMemo(() => rangeFor(period), [period]);
  const query = usePlatformEarnings(from, to);
  const [selected, setSelected] = useState<CoopEarnings | null>(null);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h3 className="text-base font-semibold text-foreground">
            Platform earnings
          </h3>
          <p className="text-sm text-muted-foreground">
            What the platform has earned from each co-operative, and where it
            came from.
          </p>
        </div>
        <Select
          value={period}
          onValueChange={(value) => setPeriod(value as Period)}
        >
          <SelectTrigger className="h-10 w-44" aria-label="Period">
            <SelectValue>{(value: Period) => PERIODS[value]}</SelectValue>
          </SelectTrigger>
          <SelectContent>
            {(Object.keys(PERIODS) as Period[]).map((key) => (
              <SelectItem key={key} value={key}>
                {PERIODS[key]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Couldn't load earnings"
      >
        {query.data ? (
          <>
            <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
              <Card className="col-span-2 bg-primary text-primary-foreground lg:col-span-1">
                <CardContent>
                  <p className="text-xs font-medium opacity-80">Total earned</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">
                    {formatNaira(query.data.total)}
                  </p>
                </CardContent>
              </Card>
              {SOURCES.map((source) => (
                <Card key={source}>
                  <CardContent>
                    <p className="text-xs font-medium text-muted-foreground">
                      {EARNING_SOURCE_LABELS[source]}
                    </p>
                    <p className="mt-1 text-lg font-semibold text-foreground tabular-nums">
                      {formatNaira(query.data.bySource[source] ?? 0)}
                    </p>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
              <table className="w-full min-w-[820px] text-left text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Co-operative
                    </th>
                    {SOURCES.map((source) => (
                      <th
                        key={source}
                        className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                      >
                        {EARNING_SOURCE_LABELS[source]}
                      </th>
                    ))}
                    <th className="px-4 py-3 text-right text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                      Total
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {query.data.cooperatives.length === 0 ? (
                    <tr>
                      <td
                        colSpan={SOURCES.length + 2}
                        className="px-4 py-8 text-center text-muted-foreground"
                      >
                        No co-operatives yet.
                      </td>
                    </tr>
                  ) : (
                    query.data.cooperatives.map((coop) => (
                      <tr
                        key={coop.cooperativeId}
                        onClick={() => setSelected(coop)}
                        className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                      >
                        <td className="px-4 py-3">
                          <p className="font-medium text-foreground">
                            {coop.cooperativeName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {coop.cooperativeId} · {coop.count} charge
                            {coop.count === 1 ? "" : "s"}
                          </p>
                        </td>
                        {SOURCES.map((source) => (
                          <td
                            key={source}
                            className="px-4 py-3 text-right text-muted-foreground tabular-nums"
                          >
                            {formatNaira(coop.bySource[source] ?? 0)}
                          </td>
                        ))}
                        <td className="px-4 py-3 text-right font-semibold text-foreground tabular-nums">
                          {formatNaira(coop.total)}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            <MobileRecordList
              isEmpty={query.data.cooperatives.length === 0}
              emptyMessage="No co-operatives yet."
            >
              {query.data.cooperatives.map((coop) => (
                <MobileRecordCard
                  key={coop.cooperativeId}
                  onClick={() => setSelected(coop)}
                  title={coop.cooperativeName}
                  fields={[
                    { label: "Total", value: formatNaira(coop.total) },
                    ...SOURCES.map((source) => ({
                      label: EARNING_SOURCE_LABELS[source],
                      value: formatNaira(coop.bySource[source] ?? 0),
                    })),
                  ]}
                />
              ))}
            </MobileRecordList>

            <p className="flex items-start gap-2 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Members pay through each co-operative&apos;s own payment account,
              so these amounts are what each co-operative owes the platform.
              Fees are counted from the day this was turned on.
            </p>
          </>
        ) : null}
      </QueryBoundary>

      <Dialog
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <DialogContent className="max-w-2xl">
          {selected ? (
            <CoopEarningsDetail
              coop={selected}
              from={from}
              to={to}
              periodLabel={PERIODS[period]}
            />
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function CoopEarningsDetail({
  coop,
  from,
  to,
  periodLabel,
}: {
  coop: CoopEarnings;
  from: string;
  to: string;
  periodLabel: string;
}) {
  const query = useCoopEarnings(coop.cooperativeId, from, to);

  return (
    <>
      <DialogHeader>
        <DialogTitle>{coop.cooperativeName}</DialogTitle>
        <DialogDescription>
          {periodLabel}: {formatNaira(coop.total)} from {coop.count} charge
          {coop.count === 1 ? "" : "s"}
        </DialogDescription>
      </DialogHeader>

      <div className="mb-4 grid grid-cols-2 gap-2">
        {SOURCES.map((source) => (
          <div key={source} className="rounded-lg bg-muted/60 px-3 py-2">
            <p className="text-xs text-muted-foreground">
              {EARNING_SOURCE_LABELS[source]}
            </p>
            <p className="font-semibold text-foreground tabular-nums">
              {formatNaira(coop.bySource[source] ?? 0)}
            </p>
          </div>
        ))}
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Couldn't load the charges"
      >
        {query.data && query.data.length === 0 ? (
          <p className="py-6 text-center text-sm text-muted-foreground">
            Nothing earned from this co-operative in this period.
          </p>
        ) : (
          <ul className="divide-y divide-border">
            {(query.data ?? []).map((entry) => (
              <li
                key={entry.id}
                className="flex items-start justify-between gap-3 py-3"
              >
                <div className="min-w-0">
                  <p className="text-sm font-medium text-foreground">
                    {EARNING_SOURCE_LABELS[entry.source]}
                  </p>
                  <p className="truncate text-xs text-muted-foreground">
                    {entry.memberName ?? entry.memberId ?? "Member"} · on{" "}
                    {formatNaira(entry.baseAmount)} ·{" "}
                    {formatDateTime(entry.createdAt)}
                  </p>
                </div>
                <p className="shrink-0 font-semibold text-foreground tabular-nums">
                  {formatNaira(entry.amount)}
                </p>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </>
  );
}
