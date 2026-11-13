import { apiClient } from "@/lib/axios";
import type { CoopLoanRecord } from "@/lib/coop-data";
import type { LoanMode } from "@/lib/loans-data";

export interface LoanApplicationPayload {
  loanTypeId: string;
  amount: number;
  loanMode: LoanMode;
  /** Required for a "TimesTwo" loan (the co-op sets how many); a "Within" loan has none. */
  guarantorMemberIds?: string[];
  /** How many months to repay over, up to the loan type's maximum. */
  durationMonths: number;
}

export interface DisbursementPreview {
  loanAmount: number;
  chargeAmount: number;
  netDisbursed: number;
}

export type CoopOffice =
  "PRESIDENT" | "VICE_PRESIDENT" | "TREASURER" | "SECRETARY";

/** A member's whole borrowing record — what officers check before approving a loan. */
export interface LoanHistory {
  memberId: string;
  memberName: string;
  totalSavings: number;
  summary: {
    activeLoans: number;
    completedLoans: number;
    rejectedLoans: number;
    pendingLoans: number;
    outstandingBalance: number;
    totalBorrowed: number;
    totalRepaid: number;
    repaymentsMade: number;
    onTimeRepayments: number;
    lateRepayments: number;
    /** 0–100, null with no repayments yet. */
    onTimeRate: number | null;
    overdueInstallments: number;
    lastRepaymentDate: string | null;
  };
  loans: {
    id: string;
    loanType: string;
    loanMode: LoanMode;
    status: string;
    amount: number;
    totalRepayment: number;
    repaid: number;
    outstanding: number;
    numberOfRepayments: number;
    repaymentsMade: number;
    overdueInstallments: number;
    appliedOn: string;
    paidOutOn: string | null;
    nextDueDate: string | null;
    repayments: {
      installmentNumber: number;
      amount: number;
      method: string;
      paidOn: string;
      dueDate: string;
      daysLate: number;
    }[];
  }[];
}

/** One seat on the loan committee, in approval order. */
export interface LoanCommitteeStep {
  position: number;
  title: string;
  memberId: string;
  memberName: string;
}

/** One committee decision, with the terms the approver suggested. */
export interface LoanCommitteeDecision {
  position: number | null;
  title: string;
  decision: "Approved" | "Rejected";
  memberName: string;
  covering: boolean;
  note: string | null;
  actedAt: string;
  suggestedAmount: number | null;
  suggestedMonths: number | null;
  previousAmount: number | null;
  previousMonths: number | null;
}

export type LoanStage =
  | "Guarantors"
  | "Approval"
  | "Acceptance"
  | "Disbursement"
  | "Active"
  | "Completed"
  | "Rejected"
  | "Declined";

/** Where a loan is (committee, offer, payout) and what the signed-in member can do now. */
export interface LoanApprovalStatus {
  chain: LoanCommitteeStep[];
  trail: LoanCommitteeDecision[];
  stage: LoanStage;
  /** 1-based committee position the loan is waiting on, during "Approval". */
  currentStep: number | null;
  canApprove: boolean;
  canReject: boolean;
  /** e.g. "Treasurer", "Admin (covering for Treasurer)". */
  actingAs: string | null;
  /** The caller is the last approver: their figures become the offer. */
  finalStep: boolean;
  canRespondToOffer: boolean;
  canDisburse: boolean;
  /** The longest repayment period this loan's type allows. */
  maxMonths: number;
  minAmount: number;
  netDisbursement: number | null;
  /** The borrower's own account on file (only sent to the borrower). */
  registeredAccount: {
    bankCode: string;
    accountNumberMasked: string;
    accountName: string;
  } | null;
}

export interface OfferResponsePayload {
  decision: "Accepted" | "Declined";
  accountType?: "Registered" | "Other";
  bankCode?: string;
  bankName?: string;
  accountNumber?: string;
  accountName?: string;
  reason?: string;
}

export interface DisbursePayload {
  method: "Online" | "Cheque";
  chequeUrl?: string;
  chequeNumber?: string;
}

/** What the signed-in member can borrow right now — the same numbers the dashboard shows and
 * the application check enforces (LoanEligibilityService). */
export interface LoanEligibilityResult {
  savings: number;
  /** Why the member can't borrow at all right now; "" when they can. */
  problem: string;
  best: number;
  tiedTimesTwo: number;
  tiedWithin: number;
  perType: {
    loanTypeId: string;
    loanTypeName: string;
    timesTwo: number;
    within: number;
    maxMonths: number;
  }[];
}

/** Settings -> Loans: the committee, loan rules and dividend rules. */
export interface LoanSettings {
  minAmount: number;
  /** Paid online before the loan form opens; 0 for no fee. */
  applicationFee: number;
  savingsMultiplier: number;
  withinPercent: number;
  minMembershipMonths: number;
  minSavings: number;
  allowConcurrentLoans: boolean;
  minGuarantors: number;
  dividendMethod: "SavingsPercent" | "InterestShare" | "None";
  dividendRate: number;
  dividendFrequency: "Monthly" | "Quarterly" | "Annually";
  committee: {
    position: number;
    memberId: string;
    memberName: string;
    title: string;
  }[];
  adminApprovesAlone: boolean;
  canEdit: boolean;
}

export type LoanSettingsPayload = Omit<
  LoanSettings,
  "committee" | "adminApprovesAlone" | "canEdit"
> & { committee: { memberId: string; title: string }[] };

/**
 * The real backend behind a member's own "Take a Loan" application, a named guarantor's
 * accept/reject, and the officers' approval chain — `LoanSelfServiceController`. The
 * Secretary's approval disburses server-side; there's no client-side transfer.
 */
export const loanSelfService = {
  async apply(
    coopId: string,
    payload: LoanApplicationPayload,
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.post<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans`,
      payload,
    );
    return data;
  },

  async guarantorResponse(
    coopId: string,
    loanId: string,
    decision: "Accepted" | "Rejected",
    documentUrl?: string,
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.patch<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/guarantor-response`,
      { decision, documentUrl },
    );
    return data;
  },

  async getDisbursementPreview(
    coopId: string,
    loanId: string,
  ): Promise<DisbursementPreview> {
    const { data } = await apiClient.get<DisbursementPreview>(
      `/cooperatives/${coopId}/loans/${loanId}/disbursement`,
    );
    return data;
  },

  async getLoanHistory(coopId: string, memberId: string): Promise<LoanHistory> {
    const { data } = await apiClient.get<LoanHistory>(
      `/cooperatives/${coopId}/members/${memberId}/loan-history`,
    );
    return data;
  },

  async getApprovals(
    coopId: string,
    loanId: string,
  ): Promise<LoanApprovalStatus> {
    const { data } = await apiClient.get<LoanApprovalStatus>(
      `/cooperatives/${coopId}/loans/${loanId}/approvals`,
    );
    return data;
  },

  async decide(
    coopId: string,
    loanId: string,
    decision: "Approved" | "Rejected",
    options?: {
      rejectionReason?: string;
      suggestedAmount?: number;
      suggestedMonths?: number;
      note?: string;
    },
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.patch<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/decision`,
      { decision, ...options },
    );
    return data;
  },

  /** The borrower accepts (choosing the payout account) or declines the approved terms. */
  async respondToOffer(
    coopId: string,
    loanId: string,
    payload: OfferResponsePayload,
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.post<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/offer-response`,
      payload,
    );
    return data;
  },

  async disburse(
    coopId: string,
    loanId: string,
    payload: DisbursePayload,
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.post<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/disburse`,
      payload,
    );
    return data;
  },

  /** Loans waiting on the signed-in member as a committee member. */
  async awaitingMe(coopId: string): Promise<CoopLoanRecord[]> {
    const { data } = await apiClient.get<CoopLoanRecord[]>(
      `/cooperatives/${coopId}/loans/awaiting-me`,
    );
    return data;
  },

  async getEligibility(coopId: string): Promise<LoanEligibilityResult> {
    const { data } = await apiClient.get<LoanEligibilityResult>(
      `/cooperatives/${coopId}/loans/eligibility`,
    );
    return data;
  },

  async getSettings(coopId: string): Promise<LoanSettings> {
    const { data } = await apiClient.get<LoanSettings>(
      `/cooperatives/${coopId}/loan-settings`,
    );
    return data;
  },

  async updateSettings(
    coopId: string,
    payload: LoanSettingsPayload,
  ): Promise<LoanSettings> {
    const { data } = await apiClient.put<LoanSettings>(
      `/cooperatives/${coopId}/loan-settings`,
      payload,
    );
    return data;
  },
};
