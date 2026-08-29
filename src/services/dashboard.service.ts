import {
  Building2,
  Landmark,
  type LucideIcon,
  Percent,
  PiggyBank,
  TrendingUp,
  Users,
} from "lucide-react";
import { apiClient } from "@/lib/axios";
import {
  getActivityChartData,
  getActivityRate,
  getChartSeries,
  getRecentActivities,
  getSummaryCards,
  type ActivityPoint,
  type RecentActivity,
  type SummaryCard,
} from "@/lib/dashboard-data";
import { formatMoney } from "@/lib/format";
import type { UserRole } from "@/types/auth";
import type { DashboardSummaryResponse } from "@/types/dashboard";

export interface DashboardSummary {
  cards: SummaryCard[];
  chart: ActivityPoint[];
  chartSeries: ReturnType<typeof getChartSeries>;
  activityRate: number;
  recentActivity: RecentActivity[];
}

// Cards come back from the backend in a fixed, role-dependent order (see
// DashboardService on the backend) — this maps each position to the
// presentation details (icon/tone/action) the UI needs, which the backend
// has no reason to know about.
const SUPER_ADMIN_CARD_STYLE: Array<Pick<SummaryCard, "tone" | "icon">> = [
  { tone: "brand", icon: Building2 },
  { tone: "violet", icon: Users },
  { tone: "sky", icon: PiggyBank },
  { tone: "amber", icon: Landmark },
];

// Admin's 4th card is "Total Members" (a count); member's is "Loan Eligibility" (an amount) —
// same three leading cards (Savings/Loans/Dividends), different last one, so these only diverge
// at index 3.
const ADMIN_CARD_STYLE: Array<Pick<SummaryCard, "tone" | "icon" | "action">> = [
  { tone: "brand", icon: PiggyBank, action: "Top up" },
  { tone: "amber", icon: Landmark, action: "Loan" },
  { tone: "violet", icon: TrendingUp, action: "Save" },
  { tone: "sky", icon: Users },
];

const MEMBER_CARD_STYLE: Array<Pick<SummaryCard, "tone" | "icon" | "action">> =
  [
    { tone: "brand", icon: PiggyBank, action: "Top up" },
    { tone: "amber", icon: Landmark, action: "Loan" },
    { tone: "violet", icon: TrendingUp, action: "Save" },
    { tone: "sky", icon: Percent },
  ];

function toSummaryCards(
  role: UserRole,
  cards: DashboardSummaryResponse["cards"],
): SummaryCard[] {
  const style =
    role === "super_admin"
      ? SUPER_ADMIN_CARD_STYLE
      : role === "admin"
        ? ADMIN_CARD_STYLE
        : MEMBER_CARD_STYLE;
  return cards.map((card, index) => {
    const presentation = style[index] ?? {
      tone: "brand" as const,
      icon: PiggyBank as LucideIcon,
    };
    const isCount =
      card.label.includes("Co-operatives") || card.label.includes("Members");
    return {
      label: card.label,
      value: isCount ? String(card.value) : formatMoney(card.value),
      ...presentation,
    };
  });
}

function toActivityRate(cards: DashboardSummaryResponse["cards"]): number {
  const savings = cards.find((c) => c.label.includes("Savings"))?.value ?? 0;
  const loans = cards.find((c) => c.label.includes("Loans"))?.value ?? 0;
  const total = savings + loans;
  if (total === 0) return 0;
  return Math.round((savings / total) * 10000) / 100;
}

function toRecentActivities(
  role: UserRole,
  activities: DashboardSummaryResponse["recentActivity"],
): RecentActivity[] {
  return activities.map((activity) => ({
    title: activity.title,
    subtitle: activity.subtitle,
    amount: formatMoney(activity.amount),
    date: new Date(activity.date).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }),
    showStatus: role !== "super_admin" && Boolean(activity.status),
  }));
}

export const dashboardService = {
  async getSummary(role: UserRole): Promise<DashboardSummary> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_DASHBOARD === "true") {
      return mockSummary(role);
    }

    const { data } =
      await apiClient.get<DashboardSummaryResponse>("/dashboard/summary");

    return {
      cards: toSummaryCards(role, data.cards),
      chart: data.chart,
      chartSeries: getChartSeries(role),
      activityRate: toActivityRate(data.cards),
      recentActivity: toRecentActivities(role, data.recentActivity),
    };
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_DASHBOARD back to "true" to use this instead.
async function mockSummary(role: UserRole): Promise<DashboardSummary> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return {
    cards: getSummaryCards(role),
    chart: getActivityChartData(),
    chartSeries: getChartSeries(role),
    activityRate: getActivityRate(),
    recentActivity: getRecentActivities(role),
  };
}
