"use client";

import { useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  ChevronRight,
  Coins,
  Info,
  Medal,
  Receipt,
  Search,
  TrendingUp,
  Trophy,
} from "lucide-react";
import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";
import { Input } from "@/components/ui/input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  AnimatedNumber,
  CoopAvatar,
  EASE,
  FEES,
  SOURCE_FEE,
  Segmented,
} from "@/components/features/settings/payment-ui";
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
import { cn } from "@/lib/utils";

const SOURCES = Object.keys(EARNING_SOURCE_LABELS) as EarningSource[];

const PERIODS = {
  thisMonth: "This month",
  lastMonth: "Last month",
  last3Months: "3 months",
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
  const [source, setSource] = useState<EarningSource | null>(null);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState<CoopEarnings | null>(null);

  const data = query.data;
  const valueOf = (coop: CoopEarnings) =>
    source ? (coop.bySource[source] ?? 0) : coop.total;

  const ranked = useMemo(() => {
    if (!data) return [];
    const term = search.trim().toLowerCase();
    return [...data.cooperatives]
      .sort(
        (a, b) =>
          (source ? (b.bySource[source] ?? 0) : b.total) -
            (source ? (a.bySource[source] ?? 0) : a.total) ||
          a.cooperativeName.localeCompare(b.cooperativeName),
      )
      .map((coop, index) => ({ coop, rank: index + 1 }))
      .filter(
        ({ coop }) =>
          !term ||
          coop.cooperativeName.toLowerCase().includes(term) ||
          coop.cooperativeId.toLowerCase().includes(term),
      );
  }, [data, search, source]);

  const max = Math.max(1, ...ranked.map(({ coop }) => valueOf(coop)));
  const charges = data?.cooperatives.reduce((sum, c) => sum + c.count, 0) ?? 0;
  const earning = data?.cooperatives.filter((c) => c.total > 0).length ?? 0;
  const top = data?.cooperatives.find((c) => c.total > 0);

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-0.5">
          <h3 className="text-base font-semibold text-foreground">
            Platform earnings
          </h3>
          <p className="text-sm text-muted-foreground">
            What you&apos;ve earned from each co-operative, and where it came
            from.
          </p>
        </div>
        <Segmented
          label="Period"
          value={period}
          onChange={setPeriod}
          options={(Object.keys(PERIODS) as Period[]).map((key) => ({
            value: key,
            label: PERIODS[key],
          }))}
        />
      </div>

      <QueryBoundary
        isLoading={query.isLoading}
        isError={query.isError}
        error={query.error}
        onRetry={() => query.refetch()}
        isRetrying={query.isFetching}
        errorTitle="Couldn't load earnings"
      >
        {data ? (
          <>
            <div className="grid grid-cols-1 gap-4 lg:grid-cols-[1.4fr_1fr]">
              <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: EASE }}
                className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-primary via-emerald-700 to-emerald-500 p-6 text-white shadow-raised"
              >
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -top-20 -right-16 size-64 rounded-full bg-white/10 blur-2xl"
                  animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
                  transition={{
                    duration: 8,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <motion.div
                  aria-hidden="true"
                  className="pointer-events-none absolute -bottom-24 -left-10 size-56 rounded-full bg-emerald-300/20 blur-3xl"
                  animate={{ x: [0, 30, 0] }}
                  transition={{
                    duration: 10,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                />
                <div className="relative flex items-center gap-2 text-sm font-medium text-white/80">
                  <Coins className="size-4" aria-hidden="true" />
                  Total earned · {PERIODS[period].toLowerCase()}
                </div>
                <p className="relative mt-3 text-4xl font-bold tracking-tight sm:text-5xl">
                  <AnimatedNumber value={data.total} />
                </p>
                <div className="relative mt-6 grid grid-cols-3 gap-3">
                  <HeroStat label="Charges" value={charges.toLocaleString()} />
                  <HeroStat
                    label="Paying co-ops"
                    value={`${earning}/${data.cooperatives.length}`}
                  />
                  <HeroStat
                    label="Top earner"
                    value={top ? top.cooperativeName : "—"}
                  />
                </div>
              </motion.div>

              <SourceDonut
                bySource={data.bySource}
                total={data.total}
                active={source}
                onSelect={setSource}
              />
            </div>

            <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
              {SOURCES.map((key, index) => {
                const meta = FEES[SOURCE_FEE[key]];
                const amount = data.bySource[key] ?? 0;
                const share = data.total > 0 ? amount / data.total : 0;
                const active = source === key;
                return (
                  <motion.button
                    key={key}
                    type="button"
                    aria-pressed={active}
                    onClick={() => setSource(active ? null : key)}
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.4,
                      delay: 0.1 + index * 0.05,
                      ease: EASE,
                    }}
                    whileTap={{ scale: 0.97 }}
                    className={cn(
                      "group relative overflow-hidden rounded-2xl border bg-card p-4 text-left shadow-card transition-all duration-200 hover:-translate-y-0.5 hover:shadow-raised",
                      active
                        ? "border-primary/50 ring-4 ring-primary/10"
                        : "border-border",
                    )}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={cn(
                          "flex size-9 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                          meta.tone,
                        )}
                      >
                        <meta.icon className="size-4.5" aria-hidden="true" />
                      </span>
                      <span className="text-xs font-semibold text-muted-foreground tabular-nums">
                        {Math.round(share * 100)}%
                      </span>
                    </div>
                    <p className="mt-3 text-xs font-medium text-muted-foreground">
                      {EARNING_SOURCE_LABELS[key]}
                    </p>
                    <p className="mt-0.5 text-lg font-bold text-foreground">
                      <AnimatedNumber value={amount} />
                    </p>
                    <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={cn("h-full rounded-full", meta.fill)}
                        initial={{ width: 0 }}
                        animate={{ width: `${share * 100}%` }}
                        transition={{ duration: 0.8, ease: EASE }}
                      />
                    </div>
                  </motion.button>
                );
              })}
            </div>

            <div className="rounded-3xl border border-border bg-card p-4 shadow-card sm:p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex items-center gap-2">
                  <Trophy
                    className="size-5 text-amber-500"
                    aria-hidden="true"
                  />
                  <h4 className="font-semibold text-foreground">
                    {source
                      ? `Top co-operatives · ${EARNING_SOURCE_LABELS[source]}`
                      : "Top co-operatives"}
                  </h4>
                  <AnimatePresence>
                    {source ? (
                      <motion.button
                        type="button"
                        initial={{ opacity: 0, scale: 0.8 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.8 }}
                        onClick={() => setSource(null)}
                        className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground hover:text-foreground"
                      >
                        Show all sources ✕
                      </motion.button>
                    ) : null}
                  </AnimatePresence>
                </div>
                <div className="relative w-full sm:w-56">
                  <Search
                    className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <Input
                    value={search}
                    onChange={(event) => setSearch(event.target.value)}
                    placeholder="Find a co-operative"
                    aria-label="Find a co-operative"
                    className="h-9 pl-9"
                  />
                </div>
              </div>

              {ranked.length === 0 ? (
                <p className="py-10 text-center text-sm text-muted-foreground">
                  {search
                    ? "No co-operative matches."
                    : "No co-operatives yet."}
                </p>
              ) : (
                <motion.ul layout className="space-y-1.5">
                  <AnimatePresence initial={false}>
                    {ranked.map(({ coop, rank }, index) => (
                      <LeaderRow
                        key={coop.cooperativeId}
                        coop={coop}
                        rank={rank}
                        index={index}
                        max={max}
                        source={source}
                        onOpen={() => setSelected(coop)}
                      />
                    ))}
                  </AnimatePresence>
                </motion.ul>
              )}
            </div>

            <p className="flex items-start gap-2 rounded-2xl bg-muted/60 px-4 py-3 text-xs text-muted-foreground">
              <Info className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
              Members pay through each co-operative&apos;s own payment account,
              so these amounts are what each co-operative owes the platform.
              Fees are counted from the day this was turned on.
            </p>
          </>
        ) : null}
      </QueryBoundary>

      <Sheet
        open={selected !== null}
        onOpenChange={(open) => {
          if (!open) setSelected(null);
        }}
      >
        <SheetContent className="max-w-lg p-0">
          {selected ? (
            <CoopEarningsDetail
              coop={selected}
              from={from}
              to={to}
              periodLabel={PERIODS[period]}
            />
          ) : null}
        </SheetContent>
      </Sheet>
    </div>
  );
}

function HeroStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0 rounded-2xl bg-white/10 px-3 py-2.5 backdrop-blur-sm">
      <p className="text-[11px] text-white/70">{label}</p>
      <p className="truncate text-sm font-semibold">{value}</p>
    </div>
  );
}

function SourceDonut({
  bySource,
  total,
  active,
  onSelect,
}: {
  bySource: Record<EarningSource, number>;
  total: number;
  active: EarningSource | null;
  onSelect: (source: EarningSource | null) => void;
}) {
  const slices = SOURCES.map((key) => ({
    key,
    name: EARNING_SOURCE_LABELS[key],
    value: bySource[key] ?? 0,
    color: FEES[SOURCE_FEE[key]].color,
  }));
  const empty = total <= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.05, ease: EASE }}
      className="flex items-center gap-4 rounded-3xl border border-border bg-card p-5 shadow-card"
    >
      <div className="relative size-36 shrink-0">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={empty ? [{ key: "none", value: 1, color: "" }] : slices}
              dataKey="value"
              nameKey="name"
              innerRadius="68%"
              outerRadius="100%"
              paddingAngle={empty ? 0 : 3}
              cornerRadius={6}
              stroke="none"
              isAnimationActive
              animationDuration={900}
              onClick={(slice: { key?: string }) => {
                if (empty || !slice?.key) return;
                const key = slice.key as EarningSource;
                onSelect(active === key ? null : key);
              }}
            >
              {(empty ? [{ key: "none", color: "" }] : slices).map((slice) => (
                <Cell
                  key={slice.key}
                  className={cn(
                    "cursor-pointer outline-none transition-opacity",
                    empty && "fill-muted",
                  )}
                  fill={empty ? undefined : slice.color}
                  opacity={active && active !== slice.key ? 0.25 : 1}
                />
              ))}
            </Pie>
            {empty ? null : (
              <Tooltip
                formatter={(value) => formatNaira(Number(value))}
                contentStyle={{
                  borderRadius: 12,
                  border: "1px solid var(--border)",
                  background: "var(--popover)",
                  color: "var(--popover-foreground)",
                  fontSize: 12,
                }}
              />
            )}
          </PieChart>
        </ResponsiveContainer>
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center text-center">
          <TrendingUp
            className="size-4 text-primary dark:text-emerald-300"
            aria-hidden="true"
          />
          <span className="mt-0.5 text-[11px] text-muted-foreground">
            {empty ? "No fees yet" : "By source"}
          </span>
        </div>
      </div>
      <ul className="min-w-0 flex-1 space-y-2">
        {slices.map((slice) => (
          <li key={slice.key}>
            <button
              type="button"
              onClick={() => onSelect(active === slice.key ? null : slice.key)}
              className={cn(
                "flex w-full items-center gap-2 rounded-lg px-2 py-1 text-left text-xs transition-colors hover:bg-muted",
                active === slice.key && "bg-muted",
                active && active !== slice.key && "opacity-50",
              )}
            >
              <span
                className="size-2.5 shrink-0 rounded-full"
                style={{ background: slice.color }}
              />
              <span className="min-w-0 flex-1 truncate text-muted-foreground">
                {slice.name}
              </span>
              <span className="font-semibold text-foreground tabular-nums">
                {total > 0 ? Math.round((slice.value / total) * 100) : 0}%
              </span>
            </button>
          </li>
        ))}
      </ul>
    </motion.div>
  );
}

function RankBadge({ rank, earned }: { rank: number; earned: boolean }) {
  if (earned && rank <= 3) {
    const tone = [
      "bg-gradient-to-br from-amber-300 to-amber-500 text-amber-950",
      "bg-gradient-to-br from-slate-200 to-slate-400 text-slate-800",
      "bg-gradient-to-br from-orange-300 to-orange-600 text-orange-950",
    ][rank - 1];
    return (
      <span
        className={cn(
          "flex size-7 shrink-0 items-center justify-center rounded-full shadow-sm",
          tone,
        )}
        aria-label={`Rank ${rank}`}
      >
        <Medal className="size-3.5" aria-hidden="true" />
      </span>
    );
  }
  return (
    <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-muted text-xs font-semibold text-muted-foreground tabular-nums">
      {rank}
    </span>
  );
}

function LeaderRow({
  coop,
  rank,
  index,
  max,
  source,
  onOpen,
}: {
  coop: CoopEarnings;
  rank: number;
  index: number;
  max: number;
  source: EarningSource | null;
  onOpen: () => void;
}) {
  const value = source ? (coop.bySource[source] ?? 0) : coop.total;
  const shown = source ? [source] : SOURCES;

  return (
    <motion.li
      layout
      initial={{ opacity: 0, x: -12 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 12 }}
      transition={{
        duration: 0.35,
        delay: Math.min(index, 10) * 0.03,
        ease: EASE,
      }}
    >
      <button
        type="button"
        onClick={onOpen}
        className="group flex w-full items-center gap-3 rounded-2xl px-2 py-2.5 text-left transition-colors hover:bg-muted/70 focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none sm:px-3"
      >
        <RankBadge rank={rank} earned={value > 0} />
        <CoopAvatar
          id={coop.cooperativeId}
          name={coop.cooperativeName}
          className="size-9 text-xs"
        />
        <div className="min-w-0 flex-1">
          <div className="flex items-baseline justify-between gap-3">
            <p className="truncate text-sm font-semibold text-foreground">
              {coop.cooperativeName}
            </p>
            <p className="shrink-0 text-sm font-bold text-foreground">
              <AnimatedNumber value={value} />
            </p>
          </div>
          <div className="mt-1.5 flex h-2 overflow-hidden rounded-full bg-muted">
            {shown.map((key) => {
              const amount = coop.bySource[key] ?? 0;
              return (
                <motion.div
                  key={key}
                  className={cn(
                    "h-full first:rounded-l-full last:rounded-r-full",
                    FEES[SOURCE_FEE[key]].fill,
                  )}
                  initial={{ width: 0 }}
                  animate={{ width: `${(amount / max) * 100}%` }}
                  transition={{ duration: 0.8, ease: EASE }}
                />
              );
            })}
          </div>
          <p className="mt-1 text-[11px] text-muted-foreground">
            {coop.cooperativeId} · {coop.count} charge
            {coop.count === 1 ? "" : "s"}
          </p>
        </div>
        <ChevronRight
          className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5"
          aria-hidden="true"
        />
      </button>
    </motion.li>
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
  const [source, setSource] = useState<EarningSource | null>(null);
  const entries = (query.data ?? []).filter(
    (entry) => !source || entry.source === source,
  );

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative overflow-hidden bg-gradient-to-br from-primary via-emerald-700 to-emerald-500 px-6 pt-6 pb-5 text-white">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute -top-16 -right-10 size-48 rounded-full bg-white/10 blur-2xl"
        />
        <SheetHeader className="relative mb-0">
          <div className="flex items-center gap-3">
            <CoopAvatar
              id={coop.cooperativeId}
              name={coop.cooperativeName}
              className="size-12 ring-2 ring-white/30"
            />
            <div className="min-w-0">
              <SheetTitle className="truncate text-white">
                {coop.cooperativeName}
              </SheetTitle>
              <SheetDescription className="text-white/75">
                {periodLabel} · {coop.count} charge
                {coop.count === 1 ? "" : "s"}
              </SheetDescription>
            </div>
          </div>
        </SheetHeader>
        <p className="relative mt-4 text-3xl font-bold tracking-tight">
          <AnimatedNumber value={coop.total} />
        </p>
      </div>

      <div className="space-y-5 p-6">
        <div className="grid grid-cols-2 gap-2">
          {SOURCES.map((key) => {
            const meta = FEES[SOURCE_FEE[key]];
            const active = source === key;
            return (
              <button
                key={key}
                type="button"
                aria-pressed={active}
                onClick={() => setSource(active ? null : key)}
                className={cn(
                  "flex items-center gap-2.5 rounded-xl border px-3 py-2.5 text-left transition-all hover:shadow-card",
                  active
                    ? "border-primary/50 bg-primary/5 ring-2 ring-primary/10"
                    : "border-border bg-muted/40",
                )}
              >
                <span
                  className={cn(
                    "flex size-8 shrink-0 items-center justify-center rounded-lg",
                    meta.tone,
                  )}
                >
                  <meta.icon className="size-4" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="truncate text-[11px] text-muted-foreground">
                    {EARNING_SOURCE_LABELS[key]}
                  </p>
                  <p className="text-sm font-semibold text-foreground tabular-nums">
                    {formatNaira(coop.bySource[key] ?? 0)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        <QueryBoundary
          isLoading={query.isLoading}
          isError={query.isError}
          error={query.error}
          onRetry={() => query.refetch()}
          isRetrying={query.isFetching}
          errorTitle="Couldn't load the charges"
        >
          {entries.length === 0 ? (
            <div className="rounded-2xl border border-dashed border-border py-10 text-center">
              <Receipt
                className="mx-auto size-8 text-muted-foreground/60"
                aria-hidden="true"
              />
              <p className="mt-2 text-sm text-muted-foreground">
                Nothing earned{source ? " from this source" : ""} in this
                period.
              </p>
            </div>
          ) : (
            <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[15px] before:w-px before:bg-border">
              {entries.map((entry, index) => {
                const meta = FEES[SOURCE_FEE[entry.source]];
                return (
                  <motion.li
                    key={entry.id}
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{
                      duration: 0.3,
                      delay: Math.min(index, 12) * 0.03,
                      ease: EASE,
                    }}
                    className="relative flex items-start gap-3"
                  >
                    <span
                      className={cn(
                        "relative z-10 flex size-8 shrink-0 items-center justify-center rounded-full ring-4 ring-card",
                        meta.tone,
                      )}
                    >
                      <meta.icon className="size-3.5" aria-hidden="true" />
                    </span>
                    <div className="min-w-0 flex-1 rounded-xl bg-muted/50 px-3 py-2">
                      <div className="flex items-baseline justify-between gap-3">
                        <p className="truncate text-sm font-medium text-foreground">
                          {entry.memberName ?? entry.memberId ?? "Member"}
                        </p>
                        <p className="shrink-0 text-sm font-bold text-emerald-700 tabular-nums dark:text-emerald-300">
                          +{formatNaira(entry.amount)}
                        </p>
                      </div>
                      <p className="truncate text-xs text-muted-foreground">
                        {EARNING_SOURCE_LABELS[entry.source]} on{" "}
                        {formatNaira(entry.baseAmount)} ·{" "}
                        {formatDateTime(entry.createdAt)}
                      </p>
                    </div>
                  </motion.li>
                );
              })}
            </ol>
          )}
        </QueryBoundary>
      </div>
    </div>
  );
}
