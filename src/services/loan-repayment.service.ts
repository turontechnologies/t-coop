import { apiClient } from "@/lib/axios";
import type { CoopLoanRecord } from "@/lib/coop-data";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_LOANS === "true";

export interface NextInstallment {
  installmentNumber: number;
  amount: number;
}

export interface InitializeRepaymentResult {
  reference: string;
  installmentNumber: number;
  amount: number;
  publicKey: string;
}

export interface LoanRepaymentRecord {
  id: string;
  loanId: string;
  installmentNumber: number;
  amount: number;
  method: "Paystack" | "Manual Upload";
  transactionId: string;
  date: string;
  status: "Success";
}

export interface RepaymentResult {
  repayment: LoanRepaymentRecord;
  loan: CoopLoanRecord;
}

/**
 * A borrower's own loan-installment repayment (Paystack initialize/confirm, mirroring
 * `savings-self.service.ts`'s deposit pattern) and an admin's manual entry after receiving
 * payment offline — real backend, `LoanRepaymentController`. Every repayment pays exactly one
 * fixed installment; the amount always comes from the server, never client-supplied.
 */
export const loanRepaymentService = {
  async getNextInstallment(
    coopId: string,
    loanId: string,
  ): Promise<NextInstallment> {
    if (USE_MOCK()) throw new Error("Mock loan repayments aren't supported.");
    const { data } = await apiClient.get<NextInstallment>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/next`,
    );
    return data;
  },

  async initialize(
    coopId: string,
    loanId: string,
  ): Promise<InitializeRepaymentResult> {
    if (USE_MOCK()) throw new Error("Mock loan repayments aren't supported.");
    const { data } = await apiClient.post<InitializeRepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/initialize`,
    );
    return data;
  },

  async confirm(
    coopId: string,
    loanId: string,
    reference: string,
  ): Promise<RepaymentResult> {
    if (USE_MOCK()) throw new Error("Mock loan repayments aren't supported.");
    const { data } = await apiClient.post<RepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/confirm`,
      { reference },
    );
    return data;
  },

  async manual(coopId: string, loanId: string): Promise<RepaymentResult> {
    if (USE_MOCK()) throw new Error("Mock loan repayments aren't supported.");
    const { data } = await apiClient.post<RepaymentResult>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments/manual`,
    );
    return data;
  },

  async list(coopId: string, loanId: string): Promise<LoanRepaymentRecord[]> {
    if (USE_MOCK()) return [];
    const { data } = await apiClient.get<LoanRepaymentRecord[]>(
      `/cooperatives/${coopId}/loans/${loanId}/repayments`,
    );
    return data;
  },
};
