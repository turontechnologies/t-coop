"use client";

import { useMemo } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  ArrowRight,
  BadgeCheck,
  Building2,
  CalendarClock,
  CircleSlash,
  Coins,
  CreditCard,
  Crown,
  Hourglass,
  PlugZap,
  ShieldAlert,
  Sparkles,
  Activity,
  type LucideIcon,
} from "lucide-react";
import {
  AnimatedNumber,
  CoopAvatar,
  EASE,
  FEES,
  SOURCE_FEE,
  subscriptionState,
} from "@/components/features/settings/payment-ui";
import { useAuditLog } from "@/hooks/use-audit-log";
import {
  useCoopPlatformFees,
  usePlatformEarnings,
} from "@/hooks/use-platform-earnings";
import {
  EARNING_SOURCE_LABELS,
  type CoopPlatformFees,
  type EarningSource,
} from "@/lib/settings-data";
import { formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";

const SOURCES = Object.keys(EARNING_SOURCE_LABELS) as EarningSource[];
const NO_FILTERS = {};
const whole = (n: number) => Math.round(n).toLocaleString();

function isoDay(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, "0")}-${String(date.getDate()).padStart(2, "0")}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

function shortDate(iso: string) {
  return new Date(`${iso}T00:00:00`).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

interface Attention {
  key: string;
  icon: LucideIcon;
  tone: string;
  title: string;
  detail: string;
  coops: CoopPlatformFees[];
  href: string;
  action: string;
}

/**
 * The super admin's command centre: what the platform earned, which co-operatives need
 * attention (expired, in grace, expiring, not paying online), and the subscription picture.
 * Shown above the platform-wide summary cards on the dashboard.
 */
export function SuperAdminCommandCentre({ name }: { name: string }) {
  const now = new Date();
  const monthStart = isoDay(new Date(now.getFullYear(), now.getMonth(), 1));
  const today = isoDay(now);
  const in14Days = isoDay(
    new Date(now.getFullYear(), now.getMonth(), now.getDate() + 14),
  );

  const coopsQuery = useCoopPlatformFees();
  const earnings = usePlatformEarnings(monthStart, today).data;
  const audit = useAuditLog(NO_FILTERS, 0, 1).data;
  const coops = useMemo(() => coopsQuery.data ?? [], [coopsQuery.data]);

  const groups = useMemo(() => {
    const by = { active: [], grace: [], locked: [], none: [] } as Record<
      ReturnType<typeof subscriptionState>,
      CoopPlatformFees[]
    >;
    for (const coop of coops) by[subscriptionState(coop)].push(coop);
    return by;
  }, [coops]);

  const attention = useMemo<Attention[]>(() => {
    const expiringSoon = groups.active.filter(
      (coop) =>
        coop.subscriptionExpiresAt && coop.subscriptionExpiresAt <= in14Days,
    );
    const offline = coops.filter((coop) => !coop.onlinePayments);
    const items: Attention[] = [
      {
        key: "locked",
        icon: CircleSlash,
        tone: "bg-rose-500/12 text-rose-700 dark:text-rose-300",
        title: "Subscription expired",
        detail: "Locked out until they renew.",
        coops: groups.locked,
        href: "/subscriptions",
        action: "Record renewals",
      },
      {
        key: "grace",
        icon: Hourglass,
        tone: "bg-amber-500/12 text-amber-700 dark:text-amber-300",
        title: "Working on grace",
        detail: "Expired, still open for a few days.",
        coops: groups.grace,
        href: "/subscriptions",
        action: "Chase renewals",
      },
      {
        key: "soon",
        icon: CalendarClock,
        tone: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
        title: "Expiring in 14 days",
        detail: "A reminder now saves a lock-out later.",
        coops: expiringSoon,
        href: "/subscriptions",
        action: "See subscriptions",
      },
      {
        key: "offline",
        icon: PlugZap,
        tone: "bg-violet-500/12 text-violet-700 dark:text-violet-300",
        title: "No online payments",
        detail: "Haven't connected their own Paystack or Flutterwave.",
        coops: offline,
        href: "/co-operatives",
        action: "View co-operatives",
      },
      {
        key: "never",
        icon: CreditCard,
        tone: "bg-slate-500/12 text-slate-700 dark:text-slate-300",
        title: "Never subscribed",
        detail: "Created but no subscription recorded yet.",
        coops: groups.none,
        href: "/subscriptions",
        action: "Set them up",
      },
    ];
    return items.filter((item) => item.coops.length > 0);
  }, [coops, groups, in14Days]);

  const failedToday = audit?.stats.failedToday ?? 0;
  const issues = attention.length + (failedToday > 0 ? 1 : 0);
  const topEarners = (earnings?.cooperatives ?? [])
    .filter((c) => c.total > 0)
    .slice(0, 4);
  const maxEarner = Math.max(1, ...topEarners.map((c) => c.total));

  const kpis: {
    label: string;
    value: React.ReactNode;
    sub: string;
    icon: LucideIcon;
    href: string;
  }[] = [
    {
      label: "Fees earned this month",
      value: earnings ? <AnimatedNumber value={earnings.total} /> : "—",
      sub: earnings
        ? `From ${whole(earnings.cooperatives.reduce((s, c) => s + c.count, 0))} charges`
        : "Loading…",
      icon: Coins,
      href: "/settings#payment",
    },
    {
      label: "Co-operatives",
      value: coopsQuery.data ? (
        <AnimatedNumber value={coops.length} format={whole} />
      ) : (
        "—"
      ),
      sub: `${groups.active.length} with an active subscription`,
      icon: Building2,
      href: "/co-operatives",
    },
    {
      label: "Paying online",
      value: coopsQuery.data
        ? `${coops.filter((c) => c.onlinePayments).length} / ${coops.length}`
        : "—",
      sub: "Have their own payment gateway",
      icon: BadgeCheck,
      href: "/co-operatives",
    },
    {
      label: "Activity today",
      value: audit ? (
        <AnimatedNumber value={audit.stats.today} format={whole} />
      ) : (
        "—"
      ),
      sub: failedToday ? `${failedToday} failed` : "No failures",
      icon: Activity,
      href: "/settings#logs",
    },
  ];

  return (
    <div className="space-y-6">
      <motion.section
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: EASE }}
        className="relative overflow-hidden rounded-3xl bg-console p-6 text-white shadow-raised sm:p-8"
      >
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -top-24 -left-16 size-80 rounded-full bg-amber-500/25 blur-3xl"
          animate={{ scale: [1, 1.15, 1], opacity: [0.6, 1, 0.6] }}
          transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
        />
        <motion.div
          aria-hidden="true"
          className="pointer-events-none absolute -right-20 -bottom-32 size-96 rounded-full bg-emerald-400/20 blur-3xl"
          animate={{ x: [0, -40, 0] }}
          transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
        />
        <div
          aria-hidden="true"
          className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.08)_1px,transparent_0)] [background-size:24px_24px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
        />

        <div className="relative flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-1.5 rounded-full bg-gradient-to-r from-amber-300 to-amber-500 px-2.5 py-0.5 text-[11px] font-bold tracking-wide text-amber-950 uppercase">
              <Crown className="size-3" aria-hidden="true" />
              Platform command centre
            </span>
            <h2 className="text-2xl font-bold tracking-tight sm:text-3xl">
              {greeting()}, {name.trim().split(/\s+/)[0] || name}
            </h2>
            <p className="text-sm text-white/70">
              Everything across every co-operative, in one place.
            </p>
          </div>
          <motion.div
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{
              delay: 0.2,
              type: "spring",
              stiffness: 300,
              damping: 20,
            }}
            className={cn(
              "flex items-center gap-2 rounded-2xl px-4 py-2.5 text-sm font-semibold ring-1",
              issues > 0
                ? "bg-amber-400/15 text-amber-200 ring-amber-300/30"
                : "bg-emerald-400/15 text-emerald-200 ring-emerald-300/30",
            )}
          >
            {issues > 0 ? (
              <>
                <span className="relative flex size-2.5">
                  <span className="absolute inline-flex size-full animate-ping rounded-full bg-amber-300 opacity-75" />
                  <span className="relative inline-flex size-2.5 rounded-full bg-amber-300" />
                </span>
                {issues} thing{issues === 1 ? "" : "s"} need
                {issues === 1 ? "s" : ""} you
              </>
            ) : (
              <>
                <Sparkles className="size-4" aria-hidden="true" />
                All clear
              </>
            )}
          </motion.div>
        </div>

        <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
          {kpis.map((kpi, index) => (
            <motion.div
              key={kpi.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{
                duration: 0.4,
                delay: 0.1 + index * 0.06,
                ease: EASE,
              }}
              whileHover={{ y: -3 }}
            >
              <Link
                href={kpi.href}
                className="group block h-full rounded-2xl bg-white/[0.06] p-4 ring-1 ring-white/10 backdrop-blur-sm transition-colors hover:bg-white/10 hover:ring-amber-300/30"
              >
                <div className="flex items-center justify-between">
                  <kpi.icon
                    className="size-4 text-amber-300"
                    aria-hidden="true"
                  />
                  <ArrowRight
                    className="size-3.5 -translate-x-1 text-white/0 transition-all group-hover:translate-x-0 group-hover:text-white/70"
                    aria-hidden="true"
                  />
                </div>
                <p className="mt-3 truncate text-2xl font-bold">{kpi.value}</p>
                <p className="truncate text-xs font-medium text-white/80">
                  {kpi.label}
                </p>
                <p className="truncate text-[11px] text-white/50">{kpi.sub}</p>
              </Link>
            </motion.div>
          ))}
        </div>
      </motion.section>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-[1.5fr_1fr]">
        <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
          <div className="mb-4 flex items-center gap-2">
            <ShieldAlert className="size-5 text-amber-500" aria-hidden="true" />
            <h3 className="font-semibold text-foreground">
              Needs your attention
            </h3>
          </div>
          {coopsQuery.isLoading ? (
            <div className="space-y-2">
              {Array.from({ length: 3 }).map((_, i) => (
                <div
                  key={i}
                  className="h-16 animate-pulse rounded-2xl bg-muted"
                />
              ))}
            </div>
          ) : issues === 0 ? (
            <div className="flex flex-col items-center gap-2 rounded-2xl bg-emerald-500/5 py-10 text-center">
              <Sparkles
                className="size-7 text-emerald-500"
                aria-hidden="true"
              />
              <p className="font-medium text-foreground">
                Nothing needs you right now
              </p>
              <p className="text-sm text-muted-foreground">
                Every co-operative is subscribed and paying online.
              </p>
            </div>
          ) : (
            <ul className="space-y-2">
              {failedToday > 0 ? (
                <AttentionRow
                  index={0}
                  icon={ShieldAlert}
                  tone="bg-rose-500/12 text-rose-700 dark:text-rose-300"
                  title={`${failedToday} failed action${failedToday === 1 ? "" : "s"} today`}
                  detail="Something people tried didn't go through. Check the activity log."
                  href="/settings#logs"
                  action="Open activity log"
                />
              ) : null}
              {attention.map((item, index) => (
                <AttentionRow
                  key={item.key}
                  index={index + 1}
                  icon={item.icon}
                  tone={item.tone}
                  title={`${item.coops.length} ${item.title.toLowerCase()}`}
                  detail={
                    item.coops
                      .slice(0, 3)
                      .map((c) =>
                        item.key === "grace" && c.graceEndsAt
                          ? `${c.cooperativeName} (until ${shortDate(c.graceEndsAt)})`
                          : item.key === "soon" && c.subscriptionExpiresAt
                            ? `${c.cooperativeName} (${shortDate(c.subscriptionExpiresAt)})`
                            : c.cooperativeName,
                      )
                      .join(", ") +
                    (item.coops.length > 3
                      ? ` and ${item.coops.length - 3} more`
                      : "") +
                    ` · ${item.detail}`
                  }
                  href={item.href}
                  action={item.action}
                  avatars={item.coops.slice(0, 3)}
                />
              ))}
            </ul>
          )}
        </section>

        <div className="space-y-6">
          <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Subscription health
              </h3>
              <Link
                href="/subscriptions"
                className="text-xs font-medium text-primary hover:underline"
              >
                Manage
              </Link>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-muted">
              {(
                [
                  ["active", "bg-emerald-500"],
                  ["grace", "bg-amber-400"],
                  ["locked", "bg-rose-500"],
                  ["none", "bg-slate-400"],
                ] as const
              ).map(([state, fill]) => (
                <motion.div
                  key={state}
                  className={cn("h-full", fill)}
                  initial={{ width: 0 }}
                  animate={{
                    width: `${coops.length ? (groups[state].length / coops.length) * 100 : 0}%`,
                  }}
                  transition={{ duration: 0.9, ease: EASE }}
                />
              ))}
            </div>
            <div className="mt-4 grid grid-cols-2 gap-2">
              {(
                [
                  ["active", "Active", "bg-emerald-500"],
                  ["grace", "In grace", "bg-amber-400"],
                  ["locked", "Expired", "bg-rose-500"],
                  ["none", "Never subscribed", "bg-slate-400"],
                ] as const
              ).map(([state, label, dot]) => (
                <div
                  key={state}
                  className="flex items-center gap-2 rounded-xl bg-muted/50 px-3 py-2"
                >
                  <span className={cn("size-2.5 rounded-full", dot)} />
                  <span className="flex-1 truncate text-xs text-muted-foreground">
                    {label}
                  </span>
                  <span className="text-sm font-bold text-foreground tabular-nums">
                    {groups[state].length}
                  </span>
                </div>
              ))}
            </div>
          </section>

          <section className="rounded-3xl border border-border bg-card p-5 shadow-card">
            <div className="mb-3 flex items-center justify-between">
              <h3 className="font-semibold text-foreground">
                Earned this month
              </h3>
              <Link
                href="/settings#payment"
                className="text-xs font-medium text-primary hover:underline"
              >
                Full breakdown
              </Link>
            </div>
            <p className="text-3xl font-bold tracking-tight text-foreground">
              <AnimatedNumber value={earnings?.total ?? 0} />
            </p>
            <div className="mt-4 space-y-2.5">
              {SOURCES.map((source) => {
                const meta = FEES[SOURCE_FEE[source]];
                const amount = earnings?.bySource[source] ?? 0;
                const share =
                  earnings && earnings.total > 0 ? amount / earnings.total : 0;
                return (
                  <div key={source} className="space-y-1">
                    <div className="flex items-center justify-between text-xs">
                      <span className="flex items-center gap-1.5 text-muted-foreground">
                        <meta.icon className="size-3.5" aria-hidden="true" />
                        {EARNING_SOURCE_LABELS[source]}
                      </span>
                      <span className="font-semibold text-foreground tabular-nums">
                        {formatNaira(amount)}
                      </span>
                    </div>
                    <div className="h-1.5 overflow-hidden rounded-full bg-muted">
                      <motion.div
                        className={cn("h-full rounded-full", meta.fill)}
                        initial={{ width: 0 }}
                        animate={{ width: `${share * 100}%` }}
                        transition={{ duration: 0.8, ease: EASE }}
                      />
                    </div>
                  </div>
                );
              })}
            </div>
            {topEarners.length > 0 ? (
              <div className="mt-5 space-y-2 border-t border-border pt-4">
                <p className="text-xs font-semibold tracking-wide text-muted-foreground uppercase">
                  Top co-operatives
                </p>
                {topEarners.map((coop) => (
                  <div
                    key={coop.cooperativeId}
                    className="flex items-center gap-2.5"
                  >
                    <CoopAvatar
                      id={coop.cooperativeId}
                      name={coop.cooperativeName}
                      className="size-7 rounded-lg text-[10px]"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex justify-between gap-2 text-xs">
                        <span className="truncate font-medium text-foreground">
                          {coop.cooperativeName}
                        </span>
                        <span className="font-semibold tabular-nums">
                          {formatNaira(coop.total)}
                        </span>
                      </div>
                      <div className="mt-1 h-1 overflow-hidden rounded-full bg-muted">
                        <motion.div
                          className="h-full rounded-full bg-gradient-to-r from-amber-400 to-amber-500"
                          initial={{ width: 0 }}
                          animate={{
                            width: `${(coop.total / maxEarner) * 100}%`,
                          }}
                          transition={{ duration: 0.8, ease: EASE }}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : null}
          </section>
        </div>
      </div>
    </div>
  );
}

function AttentionRow({
  index,
  icon: Icon,
  tone,
  title,
  detail,
  href,
  action,
  avatars,
}: {
  index: number;
  icon: LucideIcon;
  tone: string;
  title: string;
  detail: string;
  href: string;
  action: string;
  avatars?: CoopPlatformFees[];
}) {
  return (
    <motion.li
      initial={{ opacity: 0, x: -10 }}
      animate={{ opacity: 1, x: 0 }}
      transition={{ duration: 0.35, delay: index * 0.05, ease: EASE }}
    >
      <Link
        href={href}
        className="group flex items-center gap-3 rounded-2xl border border-border p-3 transition-all hover:-translate-y-0.5 hover:border-primary/30 hover:shadow-raised"
      >
        <span
          className={cn(
            "flex size-10 shrink-0 items-center justify-center rounded-xl",
            tone,
          )}
        >
          <Icon className="size-5" aria-hidden="true" />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-foreground first-letter:uppercase">
            {title}
          </p>
          <p className="line-clamp-2 text-xs text-muted-foreground">{detail}</p>
        </div>
        {avatars && avatars.length > 0 ? (
          <div className="hidden -space-x-2 sm:flex">
            {avatars.map((coop) => (
              <CoopAvatar
                key={coop.cooperativeId}
                id={coop.cooperativeId}
                name={coop.cooperativeName}
                className="size-7 rounded-full text-[10px] ring-2 ring-card"
              />
            ))}
          </div>
        ) : null}
        <span className="hidden shrink-0 items-center gap-1 text-xs font-medium text-primary group-hover:underline sm:flex">
          {action}
          <ArrowRight
            className="size-3.5 transition-transform group-hover:translate-x-0.5"
            aria-hidden="true"
          />
        </span>
      </Link>
    </motion.li>
  );
}
