import { apiClient } from "@/lib/axios";
import type { CoopLoanRecord } from "@/lib/coop-data";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_LOANS === "true";

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

/**
 * The real backend behind a member's own "Take a Loan" application, a named guarantor's
 * accept/reject, and an admin's approve/reject decision — mirrors `coop-loan.service.ts`'s
 * super-admin oversight shape, but hits `LoanSelfServiceController` instead of the read-only
 * `LoanController`. See that backend controller's own javadoc for the guarantor/decision flow.
 */
export const loanSelfService = {
  async apply(
    coopId: string,
    payload: LoanApplicationPayload,
  ): Promise<CoopLoanRecord> {
    if (USE_MOCK()) throw new Error("Mock loan applications aren't supported.");
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
    if (USE_MOCK())
      throw new Error("Mock guarantor responses aren't supported.");
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
    if (USE_MOCK()) return { loanAmount: 0, chargeAmount: 0, netDisbursed: 0 };
    const { data } = await apiClient.get<DisbursementPreview>(
      `/cooperatives/${coopId}/loans/${loanId}/disbursement`,
    );
    return data;
  },

  async decide(
    coopId: string,
    loanId: string,
    decision: "Approved" | "Rejected",
    options?: { rejectionReason?: string; transferReference?: string },
  ): Promise<CoopLoanRecord> {
    if (USE_MOCK()) throw new Error("Mock loan decisions aren't supported.");
    const { data } = await apiClient.patch<CoopLoanRecord>(
      `/cooperatives/${coopId}/loans/${loanId}/decision`,
      { decision, ...options },
    );
    return data;
  },
};
