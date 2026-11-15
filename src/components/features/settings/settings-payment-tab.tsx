"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import {
  BadgePercent,
  Banknote,
  ChartPie,
  Crown,
  type LucideIcon,
} from "lucide-react";
import { Tabs, TabsList, TabsPanel, TabsTab } from "@/components/ui/tabs";
import { CollectionAccountForm } from "@/components/features/settings/collection-account-form";
import { CoopPlatformFeesSection } from "@/components/features/settings/coop-platform-fees";
import { FeesChargesForm } from "@/components/features/settings/fees-charges-form";
import { EASE } from "@/components/features/settings/payment-ui";
import { PlatformEarningsPanel } from "@/components/features/settings/platform-earnings";
import { SettingsSubscriptionPlansTab } from "@/components/features/settings/settings-subscription-plans-tab";
import { cn } from "@/lib/utils";

type Section = "earnings" | "fees" | "account" | "subscriptions";

const SECTIONS: {
  value: Section;
  label: string;
  hint: string;
  icon: LucideIcon;
  tone: string;
}[] = [
  {
    value: "earnings",
    label: "Earnings",
    hint: "What each co-op brings in",
    icon: ChartPie,
    tone: "from-emerald-500 to-teal-600",
  },
  {
    value: "fees",
    label: "Fees & grace",
    hint: "Your cut, per co-operative",
    icon: BadgePercent,
    tone: "from-amber-300 to-amber-600",
  },
  {
    value: "account",
    label: "Payout account",
    hint: "Where your money lands",
    icon: Banknote,
    tone: "from-amber-400 to-orange-600",
  },
  {
    value: "subscriptions",
    label: "Subscription plans",
    hint: "What co-ops pay you",
    icon: Crown,
    tone: "from-teal-500 to-emerald-800",
  },
];

export function SettingsPaymentTab() {
  const [section, setSection] = useState<Section>("earnings");

  return (
    <Tabs
      value={section}
      onValueChange={(value) => setSection(value as Section)}
    >
      <TabsList className="grid w-full grid-cols-2 gap-3 overflow-visible bg-transparent p-0 lg:grid-cols-4">
        {SECTIONS.map((item, index) => {
          const selected = section === item.value;
          return (
            <TabsTab
              key={item.value}
              value={item.value}
              className="group rounded-2xl p-0 text-left whitespace-normal focus-visible:ring-4 focus-visible:ring-primary/15 focus-visible:outline-none"
            >
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: index * 0.05, ease: EASE }}
                className={cn(
                  "relative flex h-full items-center gap-3 overflow-hidden rounded-2xl border p-3 transition-all duration-200 sm:p-4",
                  selected
                    ? "border-transparent text-white shadow-raised"
                    : "border-border bg-card shadow-card group-hover:-translate-y-0.5 group-hover:shadow-raised",
                )}
              >
                {selected ? (
                  <motion.span
                    layoutId="payment-section"
                    transition={{ type: "spring", stiffness: 400, damping: 34 }}
                    className={cn(
                      "absolute inset-0 bg-gradient-to-br",
                      item.tone,
                    )}
                  />
                ) : null}
                <span
                  className={cn(
                    "relative flex size-10 shrink-0 items-center justify-center rounded-xl transition-transform duration-300 group-hover:scale-110 group-hover:-rotate-6",
                    selected
                      ? "bg-white/20 text-white"
                      : cn("bg-gradient-to-br text-white shadow-sm", item.tone),
                  )}
                >
                  <item.icon className="size-5" aria-hidden="true" />
                </span>
                <span className="relative min-w-0">
                  <span
                    className={cn(
                      "block truncate text-sm font-semibold",
                      selected ? "text-white" : "text-foreground",
                    )}
                  >
                    {item.label}
                  </span>
                  <span
                    className={cn(
                      "hidden truncate text-xs sm:block",
                      selected ? "text-white/80" : "text-muted-foreground",
                    )}
                  >
                    {item.hint}
                  </span>
                </span>
              </motion.div>
            </TabsTab>
          );
        })}
      </TabsList>

      <TabsPanel value="earnings">
        <Reveal>
          <PlatformEarningsPanel />
        </Reveal>
      </TabsPanel>
      <TabsPanel value="fees">
        <Reveal className="space-y-10">
          <FeesChargesForm />
          <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
          <CoopPlatformFeesSection />
        </Reveal>
      </TabsPanel>
      <TabsPanel value="account">
        <Reveal>
          <CollectionAccountForm />
        </Reveal>
      </TabsPanel>
      <TabsPanel value="subscriptions">
        <Reveal>
          <SettingsSubscriptionPlansTab />
        </Reveal>
      </TabsPanel>
    </Tabs>
  );
}

function Reveal({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: EASE }}
      className={className}
    >
      {children}
    </motion.div>
  );
}
