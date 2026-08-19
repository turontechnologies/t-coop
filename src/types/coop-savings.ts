/** One row of the super-admin "Members Savings" breakdown table — matches
 * SavingsTypeSummaryDto. Computed server-side (min/max/status from the co-op's own configured
 * savings_types row, earnings/total aggregated live from savings_records). */
export interface CoopSavingsTypeSummary {
  id: string;
  name: string;
  min: number;
  max: number;
  status: "Active" | "Inactive";
  earnings: number;
  total: number;
}
