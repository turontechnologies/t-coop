"use client";

import { QuickSummaryCards } from "@/components/features/dashboard/quick-summary-cards";
import { SuperAdminCommandCentre } from "@/components/features/dashboard/super-admin-dashboard";
import { ConsoleRecentActivity } from "@/components/features/dashboard/console-recent-activity";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { RecentActivities } from "@/components/features/dashboard/recent-activities";
import { useCurrency } from "@/components/providers/currency-provider";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useAuthStore } from "@/store/auth.store";

function greeting(date: Date = new Date()): string {
  const hour = date.getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const SUBTITLE: Record<string, string> = {
  super_admin: "Here's how every co-operative on the platform is doing.",
  support: "Here's what's happening across the platform today.",
  admin: "Here's how your co-operative is doing today.",
  member: "Here's a quick look at your savings and loans.",
};

function WelcomeHeader({ name, role }: { name: string; role: string }) {
  const firstName = name.trim().split(/\s+/)[0] || name;
  return (
    <div className="space-y-1">
      <h2 className="text-2xl font-semibold tracking-tight text-foreground sm:text-[1.75rem]">
        {greeting()}, {firstName}
      </h2>
      <p className="text-sm text-muted-foreground">
        {SUBTITLE[role] ?? SUBTITLE.member}
      </p>
    </div>
  );
}

export default function DashboardPage() {
  const member = useAuthStore((state) => state.member);
  const currency = useCurrency();
  const { data, isLoading } = useDashboardSummary(member?.role, currency);

  if (!member) return null;

  // The super admin's dashboard opens with its own command centre instead of the greeting.
  const header =
    member.role === "super_admin" ? (
      <SuperAdminCommandCentre name={member.name} />
    ) : (
      <WelcomeHeader name={member.name} role={member.role} />
    );

  if (isLoading || !data) {
    return (
      <div className="space-y-6 pt-8">
        {header}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-40 animate-pulse rounded-2xl bg-muted"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-2xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-2xl bg-muted" />
        </div>
      </div>
    );
  }

  // Same components for everyone; the super admin gets their console variant.
  const variant = member.role === "super_admin" ? "console" : "default";

  return (
    <div className="space-y-6 pt-8">
      {header}
      {variant === "console" ? (
        <h3 className="flex items-center gap-2 pt-2 text-xs font-semibold tracking-[0.18em] text-muted-foreground uppercase">
          <span className="h-px w-4 bg-[#c99a2e]/60" aria-hidden="true" />
          Across the platform
        </h3>
      ) : null}
      <QuickSummaryCards cards={data.cards} variant={variant} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart
            data={data.chart}
            series={data.chartSeries}
            activityRate={data.activityRate}
            activityLabel={data.activityLabel}
            variant={variant}
          />
        </div>
        {variant === "console" ? (
          <ConsoleRecentActivity activities={data.recentActivity} />
        ) : (
          <RecentActivities activities={data.recentActivity} />
        )}
      </div>
    </div>
  );
}
