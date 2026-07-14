"use client";

import { QuickSummaryCards } from "@/components/features/dashboard/quick-summary-cards";
import { ActivityChart } from "@/components/features/dashboard/activity-chart";
import { RecentActivities } from "@/components/features/dashboard/recent-activities";
import {
  getActivityChartData,
  getActivityRate,
  getChartSeries,
  getRecentActivities,
  getSummaryCards,
} from "@/lib/dashboard-data";
import { useAuthStore } from "@/store/auth.store";

export default function DashboardPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  const { role } = member;

  return (
    <div className="space-y-6 pt-6">
      <QuickSummaryCards cards={getSummaryCards(role)} />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <ActivityChart
            data={getActivityChartData()}
            series={getChartSeries(role)}
            activityRate={getActivityRate()}
          />
        </div>
        <RecentActivities activities={getRecentActivities(role)} />
      </div>
    </div>
  );
}
