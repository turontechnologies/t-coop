"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Building2,
  CalendarClock,
  ChevronRight,
  Coins,
  Plug,
  ScrollText,
  ShieldCheck,
  UserRound,
  UsersRound,
  Wallet,
  type LucideIcon,
} from "lucide-react";
import { SettingsIntegrationsTab } from "@/components/features/settings/settings-integrations-tab";
import { SettingsLogsTab } from "@/components/features/settings/settings-logs-tab";
import { SettingsPaymentTab } from "@/components/features/settings/settings-payment-tab";
import { SettingsProfileTab } from "@/components/features/settings/settings-profile-tab";
import { SuperAdminUserManagementTab } from "@/components/features/settings/super-admin-user-management-tab";
import {
  AnimatedNumber,
  EASE,
  subscriptionState,
} from "@/components/features/settings/payment-ui";
import { useIntegrationSettings } from "@/hooks/use-integration-settings";
import {
  useCoopPlatformFees,
  usePlatformEarnings,
} from "@/hooks/use-platform-earnings";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { AuthenticatedMember } from "@/types/auth";

type Section = "profile" | "payment" | "integrations" | "users" | "logs";

const SECTIONS: {
  value: Section;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    value: "profile",
    label: "My profile",
    hint: "Your details, photo and password",
    icon: UserRound,
    tone: "from-emerald-500 to-teal-600",
  },
  {
    value: "payment",
    label: "Payments & earnings",
    hint: "Fees, grace periods and what you've earned",
    icon: Wallet,
    tone: "from-amber-300 to-amber-600",
  },
  {
    value: "integrations",
    label: "Integrations",
    hint: "Payment gateways, SMS and co-op IDs",
    icon: Plug,
    tone: "from-amber-400 to-orange-600",
  },
  {
    value: "users",
    label: "Team & roles",
    hint: "Who can work on the platform",
    icon: UsersRound,
    tone: "from-teal-500 to-emerald-800",
  },
  {
    value: "logs",
    label: "Activity logs",
    hint: "Everything that happened, and who did it",
    icon: ScrollText,
    tone: "from-stone-500 to-stone-700",
  },
];

const isSection = (value: string): value is Section =>
  SECTIONS.some((section) => section.value === value);

function monthStart() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-01`;
}

function today() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
}

function greeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

/** The super admin's Settings: a summary up top, a section list, and the chosen section. */
export function SuperAdminSettings({
  member,
}: {
  member: AuthenticatedMember;
}) {
  const [section, setSection] = useState<Section>("profile");

  // The section is kept in the URL hash, so a refresh or a shared link opens the same one.
  useEffect(() => {
    const sync = () => {
      const fromHash = window.location.hash.slice(1);
      if (isSection(fromHash)) setSection(fromHash);
    };
    sync();
    window.addEventListener("hashchange", sync);
    return () => window.removeEventListener("hashchange", sync);
  }, []);

  function open(next: Section) {
    setSection(next);
    window.history.replaceState(null, "", `#${next}`);
  }

  const current =
    SECTIONS.find((item) => item.value === section) ?? SECTIONS[0];

  return (
    <div className="space-y-6 pt-6">
      <SettingsHero member={member} onOpen={open} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr]">
        <nav
          aria-label="Settings sections"
          className="lg:sticky lg:top-6 lg:self-start"
        >
          <ul className="flex gap-2 overflow-x-auto pb-1 [scrollbar-width:none] lg:flex-col lg:overflow-visible lg:rounded-3xl lg:border lg:border-border lg:bg-card lg:p-2 lg:shadow-card [&::-webkit-scrollbar]:hidden">
            {SECTIONS.map((item, index) => {
              const selected = item.value === section;
              return (
                <motion.li
                  key={item.value}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{
                    duration: 0.35,
                    delay: index * 0.04,
                    ease: EASE,
                  }}
                  className="shrink-0"
                >
                  <button
                    type="button"
                    onClick={() => open(item.value)}
                    aria-current={selected ? "page" : undefined}
                    className={cn(
                      "group relative flex w-full items-center gap-3 rounded-2xl px-3 py-2.5 text-left transition-colors focus-visible:ring-2 focus-visible:ring-ring/40 focus-visible:outline-none",
                      selected
                        ? "text-foreground"
                        : "text-muted-foreground hover:bg-muted/70 hover:text-foreground",
                      "max-lg:border max-lg:border-border max-lg:bg-card",
                    )}
                  >
                    {selected ? (
                      <motion.span
                        layoutId="super-settings-nav"
                        transition={{
                          type: "spring",
                          stiffness: 420,
                          damping: 36,
                        }}
                        className="absolute inset-0 rounded-2xl bg-accent ring-1 ring-primary/15"
                      />
                    ) : null}
                    <span
                      className={cn(
                        "relative flex size-9 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br text-white shadow-sm transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                        item.tone,
                      )}
                    >
                      <item.icon className="size-4.5" aria-hidden="true" />
                    </span>
                    <span className="relative min-w-0">
                      <span className="block text-sm font-semibold whitespace-nowrap">
                        {item.label}
                      </span>
                      <span className="hidden truncate text-xs text-muted-foreground lg:block">
                        {item.hint}
                      </span>
                    </span>
                    <ChevronRight
                      className={cn(
                        "relative ml-auto hidden size-4 shrink-0 transition-all lg:block",
                        selected
                          ? "translate-x-0 text-primary opacity-100 dark:text-emerald-300"
                          : "-translate-x-1 opacity-0 group-hover:translate-x-0 group-hover:opacity-60",
                      )}
                      aria-hidden="true"
                    />
                  </button>
                </motion.li>
              );
            })}
          </ul>
        </nav>

        <div className="min-w-0 rounded-3xl border border-border bg-card shadow-card">
          <div className="flex items-center gap-3 border-b border-border px-5 py-4 sm:px-6">
            <AnimatePresence mode="popLayout" initial={false}>
              <motion.span
                key={current.value}
                initial={{ opacity: 0, scale: 0.6, rotate: -20 }}
                animate={{ opacity: 1, scale: 1, rotate: 0 }}
                exit={{ opacity: 0, scale: 0.6 }}
                transition={{ type: "spring", stiffness: 380, damping: 24 }}
                className={cn(
                  "flex size-11 shrink-0 items-center justify-center rounded-2xl bg-gradient-to-br text-white shadow-raised",
                  current.tone,
                )}
              >
                <current.icon className="size-5" aria-hidden="true" />
              </motion.span>
            </AnimatePresence>
            <div className="min-w-0">
              <h2 className="truncate text-lg font-semibold text-foreground">
                {current.label}
              </h2>
              <p className="truncate text-sm text-muted-foreground">
                {current.hint}
              </p>
            </div>
          </div>

          <AnimatePresence mode="wait" initial={false}>
            <motion.div
              key={section}
              initial={{ opacity: 0, y: 14 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
              transition={{ duration: 0.3, ease: EASE }}
              className="p-5 sm:p-6"
            >
              {section === "profile" ? (
                <SettingsProfileTab member={member} />
              ) : null}
              {section === "payment" ? <SettingsPaymentTab /> : null}
              {section === "integrations" ? <SettingsIntegrationsTab /> : null}
              {section === "users" ? <SuperAdminUserManagementTab /> : null}
              {section === "logs" ? <SettingsLogsTab /> : null}
            </motion.div>
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}

function SettingsHero({
  member,
  onOpen,
}: {
  member: AuthenticatedMember;
  onOpen: (section: Section) => void;
}) {
  const earnings = usePlatformEarnings(monthStart(), today()).data;
  const coops = useCoopPlatformFees().data;
  const integrations = useIntegrationSettings().data;

  const inGrace = useMemo(
    () =>
      (coops ?? []).filter((row) => subscriptionState(row) === "grace").length,
    [coops],
  );
  const connected = integrations
    ? [
        integrations.paystackEnabled,
        integrations.flutterwaveEnabled,
        integrations.opayEnabled,
        integrations.smsEnabled,
      ].filter(Boolean).length
    : null;

  const stats: {
    label: string;
    value: React.ReactNode;
    icon: LucideIcon;
    section: Section;
  }[] = [
    {
      label: "Earned this month",
      value: earnings ? <AnimatedNumber value={earnings.total} /> : "—",
      icon: Coins,
      section: "payment",
    },
    {
      label: "Co-operatives",
      value: coops ? (
        <AnimatedNumber
          value={coops.length}
          format={(n) => String(Math.round(n))}
        />
      ) : (
        "—"
      ),
      icon: Building2,
      section: "payment",
    },
    {
      label: "In grace period",
      value: coops ? (
        <AnimatedNumber value={inGrace} format={(n) => String(Math.round(n))} />
      ) : (
        "—"
      ),
      icon: CalendarClock,
      section: "payment",
    },
    {
      label: "Services connected",
      value: connected === null ? "—" : `${connected} of 4`,
      icon: Plug,
      section: "integrations",
    },
  ];

  return (
    <motion.section
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: EASE }}
      className="relative overflow-hidden rounded-3xl bg-console p-6 text-white shadow-raised sm:p-8"
    >
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -top-24 -right-20 size-72 rounded-full bg-white/10 blur-3xl"
        animate={{ scale: [1, 1.12, 1], opacity: [0.7, 1, 0.7] }}
        transition={{ duration: 9, repeat: Infinity, ease: "easeInOut" }}
      />
      <motion.div
        aria-hidden="true"
        className="pointer-events-none absolute -bottom-28 left-1/3 size-64 rounded-full bg-emerald-300/20 blur-3xl"
        animate={{ x: [0, 40, 0] }}
        transition={{ duration: 12, repeat: Infinity, ease: "easeInOut" }}
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_1px_1px,rgba(255,255,255,0.12)_1px,transparent_0)] [background-size:22px_22px] [mask-image:linear-gradient(to_bottom,black,transparent)]"
      />

      <div className="relative flex flex-wrap items-center gap-4">
        {member.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={member.avatarUrl}
            alt=""
            className="size-14 rounded-2xl object-cover ring-2 ring-white/30"
          />
        ) : (
          <span className="flex size-14 items-center justify-center rounded-2xl bg-white/15 text-lg font-bold ring-2 ring-white/25 backdrop-blur-sm">
            {getInitials(member.name)}
          </span>
        )}
        <div className="min-w-0">
          <p className="text-sm text-white/75">{greeting()},</p>
          <h1 className="truncate text-2xl font-bold tracking-tight sm:text-3xl">
            {member.name}
          </h1>
          <p className="mt-1 inline-flex items-center gap-1.5 rounded-full bg-white/15 px-2.5 py-0.5 text-xs font-medium backdrop-blur-sm">
            <ShieldCheck className="size-3.5" aria-hidden="true" />
            Super admin · Platform settings
          </p>
        </div>
      </div>

      <div className="relative mt-6 grid grid-cols-2 gap-3 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            type="button"
            onClick={() => onOpen(stat.section)}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{
              duration: 0.4,
              delay: 0.15 + index * 0.06,
              ease: EASE,
            }}
            whileHover={{ y: -3 }}
            whileTap={{ scale: 0.97 }}
            className="group rounded-2xl bg-white/10 p-3.5 text-left ring-1 ring-white/15 backdrop-blur-sm transition-colors hover:bg-white/15 focus-visible:ring-2 focus-visible:ring-white/60 focus-visible:outline-none"
          >
            <div className="flex items-center justify-between">
              <stat.icon className="size-4 text-white/80" aria-hidden="true" />
              <ChevronRight
                className="size-3.5 text-white/0 transition-all group-hover:translate-x-0.5 group-hover:text-white/70"
                aria-hidden="true"
              />
            </div>
            <p className="mt-2 truncate text-xl font-bold">{stat.value}</p>
            <p className="truncate text-xs text-white/70">{stat.label}</p>
          </motion.button>
        ))}
      </div>
    </motion.section>
  );
}
