/** One row of the super-admin "Loans" breakdown table — matches LoanTypeSummaryDto. Computed
 * server-side (eligibility/duration/interest from the co-op's own configured loan_types row,
 * earnings aggregated live from loan_records). */
export interface CoopLoanTypeSummary {
  id: string;
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
  numberOfRepayments: number;
  interestRate: number;
  status: "Active" | "Inactive";
  earnings: number;
}
