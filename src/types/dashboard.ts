export interface DashboardSummaryCard {
  label: string;
  value: number;
}

export interface DashboardLoanTypeEligibility {
  loanTypeId: string;
  loanTypeName: string;
  timesTwo: number;
  within: number;
}

export interface DashboardActivityPoint {
  /** The day, e.g. "12 Nov" — the chart covers the last 30 days. */
  label: string;
  savings: number;
  loans: number;
  dividends: number;
}

export interface DashboardRecentActivity {
  title: string;
  subtitle: string;
  amount: number;
  date: string;
  status?: string | null;
}

export interface DashboardSummaryResponse {
  cards: DashboardSummaryCard[];
  chart: DashboardActivityPoint[];
  recentActivity: DashboardRecentActivity[];
  loanEligibilityByType?: DashboardLoanTypeEligibility[];
  /** 0-100; `activityLabel` says what it measures. */
  activityRate?: number;
  activityLabel?: string;
}
