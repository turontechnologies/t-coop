"use client";

import { QuickSummaryCards } from "@/components/features/dashboard/quick-summary-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { RecentActivities } from "@/components/features/dashboard/recent-activities";
import { useCurrency } from "@/components/providers/currency-provider";
import { useDashboardSummary } from "@/hooks/use-dashboard-summary";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardPage() {
  const member = useAuthStore((state) => state.member);
  const currency = useCurrency();
  const { data, isLoading } = useDashboardSummary(member?.role, currency);

  if (!member) return null;

  if (isLoading || !data) {
    return (
      <div className="space-y-6 pt-6">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div
              key={index}
              className="h-28 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          <div className="h-80 animate-pulse rounded-xl bg-muted lg:col-span-2" />
          <div className="h-80 animate-pulse rounded-xl bg-muted" />
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <QuickSummaryCards cards={data.cards} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart
            data={data.chart}
            series={data.chartSeries}
            activityRate={data.activityRate}
          />
        </div>
        <RecentActivities activities={data.recentActivity} />
      </div>
    </div>
  );
}
