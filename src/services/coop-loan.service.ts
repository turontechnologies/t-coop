import { apiClient } from "@/lib/axios";
import type { CoopLoanRecord } from "@/lib/coop-data";
import type { LoanTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

export interface CoopLoanRecordFilters {
  memberId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

/**
 * Loans oversight (the `/co-operatives/[id]/loans/...` routes, and — since `LoanController`
 * scopes access down for non-staff callers — the record list/detail these hooks also back on the
 * admin/member self-service `/loans` pages). The self-service mutations (apply, guarantor
 * response, decision) live in `loan-self.service.ts` against `LoanSelfServiceController`. Mirrors
 * coop-savings.service.ts exactly.
 */
export const coopLoanService = {
  async getLoanTypes(coopId: string): Promise<CoopLoanTypeSummary[]> {
    const { data } = await apiClient.get<CoopLoanTypeSummary[]>(
      `/cooperatives/${coopId}/loans/types`,
    );
    return data;
  },

  async getLoanRecords(
    coopId: string,
    filters: CoopLoanRecordFilters = {},
  ): Promise<CoopLoanRecord[]> {
    const { data } = await apiClient.get<CoopLoanRecord[]>(
      `/cooperatives/${coopId}/loans`,
      { params: filters },
    );
    return data;
  },

  async getLoanRecord(recordId: string): Promise<CoopLoanRecord> {
    const { data } = await apiClient.get<CoopLoanRecord>(`/loans/${recordId}`);
    return data;
  },

  async createLoanType(
    coopId: string,
    values: LoanTypeSettingFormValues,
  ): Promise<CoopLoanTypeSummary> {
    const { data } = await apiClient.post<CoopLoanTypeSummary>(
      `/cooperatives/${coopId}/loans/types`,
      toLoanTypeRequest(values),
    );
    return data;
  },

  async updateLoanType(
    coopId: string,
    typeId: string,
    values: LoanTypeSettingFormValues,
  ): Promise<CoopLoanTypeSummary> {
    const { data } = await apiClient.patch<CoopLoanTypeSummary>(
      `/cooperatives/${coopId}/loans/types/${typeId}`,
      toLoanTypeRequest(values),
    );
    return data;
  },

  async updateLoanTypeStatus(
    coopId: string,
    typeId: string,
    status: "Active" | "Inactive",
  ): Promise<CoopLoanTypeSummary> {
    const { data } = await apiClient.patch<CoopLoanTypeSummary>(
      `/cooperatives/${coopId}/loans/types/${typeId}/status`,
      { status },
    );
    return data;
  },
};

// LoanTypeCreateRequest on the backend names two fields differently from the response DTO
// (numberOfInstallments vs numberOfRepayments, interestAmount vs interestRate) — this is the one
// place that mismatch needs bridging.
function toLoanTypeRequest(values: LoanTypeSettingFormValues) {
  return {
    name: values.name,
    eligibilityPercent: values.eligibilityPercent,
    durationMonths: values.durationMonths,
    maxAmount: values.maxAmount,
    repaymentInterval: values.repaymentInterval,
    numberOfInstallments: values.numberOfInstallments,
    interestType: values.interestType,
    interestAmount: values.interestAmount,
  };
}
