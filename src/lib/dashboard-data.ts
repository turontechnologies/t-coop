import {
  Building2,
  Landmark,
  type LucideIcon,
  PiggyBank,
  TrendingUp,
  Users,
} from "lucide-react";
import type { UserRole } from "@/types/auth";

export interface SummaryCard {
  label: string;
  value: string;
  action?: string;
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
  showStatus: boolean;
}

const CHART_DATA: ActivityPoint[] = [
  { hour: "00", savings: 120, loans: 180, dividends: 90 },
  { hour: "03", savings: 260, loans: 340, dividends: 160 },
  { hour: "06", savings: 620, loans: 780, dividends: 420 },
  { hour: "08", savings: 730, loans: 969, dividends: 540 },
  { hour: "09", savings: 700, loans: 900, dividends: 560 },
  { hour: "12", savings: 560, loans: 640, dividends: 480 },
  { hour: "15", savings: 600, loans: 660, dividends: 520 },
  { hour: "18", savings: 480, loans: 560, dividends: 430 },
  { hour: "21", savings: 260, loans: 340, dividends: 240 },
  { hour: "23", savings: 180, loans: 220, dividends: 160 },
];

const RECENT_ACTIVITIES: RecentActivity[] = [
  {
    title: "Savings & Contribution",
    subtitle: "Yomidun Co-operative",
    amount: "₦30,000",
    date: "13th April 2021",
    showStatus: false,
  },
  {
    title: "Loan Disbursement",
    subtitle: "Turon Co-operative",
    amount: "₦50,000",
    date: "13th April 2021",
    showStatus: false,
  },
  {
    title: "Dividends",
    subtitle: "John Snow and Sons",
    amount: "₦150,000",
    date: "13th April 2021",
    showStatus: false,
  },
  {
    title: "Savings & Contribution",
    subtitle: "Turon Co-operative",
    amount: "₦350,000",
    date: "13th April 2021",
    showStatus: false,
  },
];

export function getSummaryCards(role: UserRole): SummaryCard[] {
  if (role === "super_admin") {
    return [
      {
        label: "Total Co-operatives",
        value: "9",
        tone: "brand",
        icon: Building2,
      },
      { label: "Total Members", value: "909", tone: "violet", icon: Users },
      {
        label: "Total Savings",
        value: "₦209,000,000",
        tone: "sky",
        icon: PiggyBank,
      },
      {
        label: "Total Loans",
        value: "₦209,000,000",
        tone: "amber",
        icon: Landmark,
      },
    ];
  }

  const prefix = role === "admin" ? "Total" : "My";
  return [
    {
      label: `${prefix} Savings`,
      value: "₦650,000,000",
      action: "Top up",
      tone: "brand",
      icon: PiggyBank,
    },
    {
      label: `${prefix} Loans`,
      value: "₦150,000,000",
      action: "Loan",
      tone: "amber",
      icon: Landmark,
    },
    {
      label: `${prefix} Dividends`,
      value: "₦90,500,000",
      action: "Save",
      tone: "violet",
      icon: TrendingUp,
    },
  ];
}

export function getActivityChartData(): ActivityPoint[] {
  return CHART_DATA;
}

export function getActivityRate(): number {
  return 85.07;
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

export function getRecentActivities(role: UserRole): RecentActivity[] {
  const showStatus = role !== "super_admin";
  return RECENT_ACTIVITIES.map((activity) => ({ ...activity, showStatus }));
}
