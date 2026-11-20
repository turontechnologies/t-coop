import { apiClient } from "@/lib/axios";

/** A co-op's financial report for a date range — `FinancialReportController`. Flows (deposits,
 * payouts, repayments, income) cover the range; outstanding, overdue, ageing and "in progress"
 * are as of today. */
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
    openingBalance: number;
    /** How many different members made a deposit in the range. */
    savers: number;
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
    appliedAmount: number;
    approved: number;
    approvedAmount: number;
    inProgress: number;
    pendingDisbursement: number;
    firstPendingDisbursementId: string | null;
    par30Amount: number;
  };
  income: {
    interestEarned: number;
    loanCharges: number;
    savingsCharges: number;
    withdrawalFees: number;
    applicationFees: number;
    total: number;
  };
  monthly: {
    month: string;
    deposits: number;
    withdrawals: number;
    loansPaidOut: number;
    repayments: number;
    interest: number;
    fees: number;
    income: number;
    closingBalance: number;
  }[];
  byLoanType: {
    loanType: string;
    loanTypeId: string | null;
    months: number;
    interestType: string | null;
    interestAmount: number;
    applications: number;
    loansPaidOut: number;
    principal: number;
    repaid: number;
    interest: number;
    outstanding: number;
    overdue: number;
  }[];
  overdue: {
    loanId: string;
    memberId: string;
    memberName: string;
    loanType: string;
    outstanding: number;
    overdueInstallments: number;
    oldestDueDate: string | null;
    daysLate: number;
    amountDue: number;
  }[];
  ageing: { name: string; count: number; amount: number }[];
  members: ReportMember[];
}

export interface ReportMember {
  memberId: string;
  name: string;
  role: string;
  avatarUrl: string | null;
  opening: number;
  deposits: number;
  withdrawals: number;
  charges: number;
  closing: number;
  lastDeposit: string | null;
  outstanding: number;
  activeLoans: number;
  overdueInstallments: number;
  /** 0–100, or null when they've made no repayments. */
  onTimeRate: number | null;
  /** 0–100, or null when no meeting was marked for them. */
  attendanceRate: number | null;
  lastActivity: string | null;
}

/** One member's savings and loan movements for a range. */
export interface MemberStatement {
  memberId: string;
  memberName: string;
  currency: string;
  from: string;
  to: string;
  opening: number;
  closing: number;
  owesToday: number;
  savingsRows: {
    date: string;
    type: "Deposit" | "Withdrawal" | "Loan";
    details: string;
    amount: number;
    balance: number;
    reference: string | null;
  }[];
  loanRows: {
    date: string;
    details: string;
    /** Positive when paid out to them, negative for a repayment. */
    amount: number;
    loanId: string;
    reference: string | null;
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

  async getMemberStatement(
    coopId: string,
    memberId: string,
    range: { from: string; to: string },
  ): Promise<MemberStatement> {
    const { data } = await apiClient.get<MemberStatement>(
      `/cooperatives/${coopId}/reports/members/${encodeURIComponent(memberId)}/statement`,
      { params: range },
    );
    return data;
  },
};
