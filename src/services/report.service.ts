import { apiClient } from "@/lib/axios";

/** A co-op's financial report for a date range — `FinancialReportController`. Flows (deposits,
 * payouts, repayments, income) cover the range; outstanding and overdue balances are as of today. */
export interface FinancialReport {
  cooperativeId: string;
  cooperativeName: string;
  currency: string;
  from: string;
  to: string;
  generatedAt: string;
  savings: {
    deposits: number;
    depositCount: number;
    withdrawals: number;
    withdrawalCount: number;
    /** Taken out of members' savings to fund Within loans. */
    withinLoanDebits: number;
    /** Repaid Within-loan principal returned to members' savings. */
    withinLoanCredits: number;
    netChange: number;
    closingBalance: number;
  };
  loans: {
    applications: number;
    paidOut: number;
    principalPaidOut: number;
    netPaidOut: number;
    rejected: number;
    repaymentsCollected: number;
    repaymentCount: number;
    activeLoans: number;
    outstandingBalance: number;
    overdueLoans: number;
    overdueOutstanding: number;
  };
  income: {
    interestEarned: number;
    loanCharges: number;
    savingsCharges: number;
    withdrawalFees: number;
    total: number;
  };
  monthly: {
    month: string;
    deposits: number;
    withdrawals: number;
    loansPaidOut: number;
    repayments: number;
  }[];
  byLoanType: {
    loanType: string;
    loansPaidOut: number;
    principal: number;
    repaid: number;
    outstanding: number;
  }[];
  overdue: {
    loanId: string;
    memberId: string;
    memberName: string;
    loanType: string;
    outstanding: number;
    overdueInstallments: number;
    oldestDueDate: string | null;
  }[];
}

export const reportService = {
  async getFinancialReport(
    coopId: string,
    range: { from: string; to: string },
  ): Promise<FinancialReport> {
    const { data } = await apiClient.get<FinancialReport>(
      `/cooperatives/${coopId}/reports/financial`,
      { params: range },
    );
    return data;
  },
};
