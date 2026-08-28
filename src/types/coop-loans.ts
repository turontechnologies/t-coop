/** One row of the super-admin "Loans" breakdown table — matches LoanTypeSummaryDto. Computed
 * server-side (eligibility/duration/interest from the co-op's own configured loan_types row,
 * earnings aggregated live from loan_records). */
export type RepaymentInterval = "Weekly" | "Monthly" | "Quarterly";
export type InterestType = "Percentage" | "Fixed" | "NoInterest";

export interface CoopLoanTypeSummary {
  id: string;
  name: string;
  eligibilityPercent: number;
  durationMonths: number;
  maxAmount: number;
  repaymentInterval: RepaymentInterval;
  numberOfRepayments: number;
  interestType: InterestType;
  interestRate: number;
  status: "Active" | "Inactive";
  earnings: number;
}
