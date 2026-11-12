import { apiClient } from "@/lib/axios";
import type { CoopPaymentGateway } from "@/lib/coop-checkout";

export interface LoanFeeCredit {
  reference: string;
  amount: number;
  paidAt: string | null;
}

/** The co-op's loan application fee and whether the member has a paid one waiting. */
export interface LoanFeeStatus {
  /** 0 means no fee. */
  fee: number;
  credit: LoanFeeCredit | null;
  canPayOnline: boolean;
  merchantName: string;
}

export interface LoanFeeCheckout {
  reference: string;
  amount: number;
  gateway: CoopPaymentGateway;
  publicKey: string;
}

/** LoanApplicationFeeController: pay the fee before the loan form opens. */
export const loanFeeService = {
  async status(coopId: string): Promise<LoanFeeStatus> {
    const { data } = await apiClient.get<LoanFeeStatus>(
      `/cooperatives/${coopId}/loans/application-fee`,
    );
    return data;
  },

  async initialize(coopId: string): Promise<LoanFeeCheckout> {
    const { data } = await apiClient.post<LoanFeeCheckout>(
      `/cooperatives/${coopId}/loans/application-fee/initialize`,
    );
    return data;
  },

  /** Verified with the gateway server-side. */
  async confirm(coopId: string, reference: string): Promise<LoanFeeCredit> {
    const { data } = await apiClient.post<LoanFeeCredit>(
      `/cooperatives/${coopId}/loans/application-fee/confirm`,
      { reference },
    );
    return data;
  },
};
