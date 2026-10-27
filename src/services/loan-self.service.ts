import { apiClient } from "@/lib/axios";
import type { CoopLoanRecord } from "@/lib/coop-data";

export interface LoanApplicationPayload {
  loanTypeId: string;
  amount: number;
  guarantorMemberId: string;
}

export interface DisbursementPreview {
  loanAmount: number;
  chargeAmount: number;
  netDisbursed: number;
}

export type CoopOffice =
  "PRESIDENT" | "VICE_PRESIDENT" | "TREASURER" | "SECRETARY";

/** Where a loan is in the officer approval chain, as the signed-in member sees it. */
export interface LoanApprovalStatus {
  /** Vice President -> Treasurer -> Secretary, with whoever holds each office (null = vacant;
   * the co-op admin covers it). */
  chain: { office: CoopOffice; label: string; holderName: string | null }[];
  trail: {
    office: CoopOffice;
    label: string;
    decision: "Approved" | "Rejected";
    memberName: string;
    covering: boolean;
    note: string | null;
    actedAt: string;
  }[];
  /** The office the loan is waiting on, or null when it isn't in the chain. */
  currentStep: CoopOffice | null;
  canApprove: boolean;
  canReject: boolean;
  /** e.g. "Treasurer", "Admin (covering for Treasurer)", "President". */
  actingAs: string | null;
  netDisbursement: number | null;
}

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
    options?: { rejectionReason?: string },
  ): Promise<CoopLoanRecord> {
    const { data } = await apiClient.patch<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/decision`,
      { decision, ...options },
    );
    return data;
  },
};
