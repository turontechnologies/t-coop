export interface DashboardSummaryCard {
  label: string;
  value: number;
}

export interface DashboardActivityPoint {
  hour: string;
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
}
