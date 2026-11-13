import { apiClient } from "@/lib/axios";
import type { CoopPaymentGateway } from "@/lib/coop-checkout";

export interface LoanFeeCredit {
  reference: string;
  amount: number;
  paidAt: string | null;
  /** The loan type the fee was paid for, when fees are set per type. */
  loanTypeId?: string | null;
}

/** One loan type's fee, and whether the member has paid it and not used it yet. */
export interface LoanTypeFee {
  loanTypeId: string;
  loanTypeName: string;
  fee: number;
  credit: LoanFeeCredit | null;
}

/** The co-op's loan application fee and whether the member has a paid one waiting. */
export interface LoanFeeStatus {
  /** "General": one fee for every loan. "PerType": the member picks a type, then pays its fee. */
  mode: "General" | "PerType";
  /** The general fee, or the asked-about type's fee. 0 means no fee. */
  fee: number;
  credit: LoanFeeCredit | null;
  /** Every active loan type with its fee (used when mode is "PerType"). */
  types: LoanTypeFee[];
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
    return { ...data, mode: data.mode ?? "General", types: data.types ?? [] };
  },

  /** loanTypeId is required when fees are set per loan type. */
  async initialize(
    coopId: string,
    loanTypeId?: string,
  ): Promise<LoanFeeCheckout> {
    const { data } = await apiClient.post<LoanFeeCheckout>(
      `/cooperatives/${coopId}/loans/application-fee/initialize`,
      { loanTypeId: loanTypeId ?? null },
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
