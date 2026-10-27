import type { LucideIcon } from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface SummaryCard {
  label: string;
  value: string;
  action?: string;
  actionHref?: string;
  tone: "brand" | "violet" | "sky" | "amber";
  icon: LucideIcon;
}

export interface ActivityPoint {
  hour: string;
  savings: number;
  loans: number;
  dividends: number;
}

export interface RecentActivity {
  title: string;
  subtitle: string;
  amount: string;
  date: string;
  status: string | null;
}

export function getChartSeries(
  role: UserRole,
): Array<{ key: keyof Omit<ActivityPoint, "hour">; label: string }> {
  if (role === "super_admin") {
    return [
      { key: "savings", label: "Savings" },
      { key: "loans", label: "Loans" },
    ];
  }
  return [
    { key: "savings", label: "Savings" },
    { key: "loans", label: "Loans" },
    { key: "dividends", label: "Dividends" },
  ];
}
