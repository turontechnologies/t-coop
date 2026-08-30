import { apiClient } from "@/lib/axios";
import {
  coopLoansBySummaryType,
  findCooperative,
  type CoopLoanRecord,
} from "@/lib/coop-data";
import type { LoanTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import { useCoopStore } from "@/store/coop.store";
import type { CoopLoanTypeSummary } from "@/types/coop-loans";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_COOPERATIVES === "true";

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
    if (USE_MOCK()) return mockGetLoanTypes(coopId);
    const { data } = await apiClient.get<CoopLoanTypeSummary[]>(
      `/cooperatives/${coopId}/loans/types`,
    );
    return data;
  },

  async getLoanRecords(
    coopId: string,
    filters: CoopLoanRecordFilters = {},
  ): Promise<CoopLoanRecord[]> {
    if (USE_MOCK()) return mockGetLoanRecords(coopId, filters);
    const { data } = await apiClient.get<CoopLoanRecord[]>(
      `/cooperatives/${coopId}/loans`,
      { params: filters },
    );
    return data;
  },

  async getLoanRecord(recordId: string): Promise<CoopLoanRecord> {
    if (USE_MOCK()) return mockGetLoanRecord(recordId);
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

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_COOPERATIVES back to "true" to use these instead.
async function mockGetLoanTypes(
  coopId: string,
): Promise<CoopLoanTypeSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coopLoansBySummaryType(coop).map((type, index) => ({
    id: `mock-loan-type-${index}`,
    ...type,
    maxAmount: 0,
    repaymentInterval: "Monthly" as const,
    interestType: "Percentage" as const,
    status: "Active" as const,
  }));
}

async function mockGetLoanRecords(
  coopId: string,
  filters: CoopLoanRecordFilters,
): Promise<CoopLoanRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coop.loans.filter((record) => {
    if (filters.memberId && record.memberId !== filters.memberId) return false;
    if (filters.type && record.loanType !== filters.type) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (filters.from && record.date < filters.from) return false;
    if (filters.to && record.date > filters.to) return false;
    return true;
  });
}

async function mockGetLoanRecord(recordId: string): Promise<CoopLoanRecord> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (const coop of useCoopStore.getState().cooperatives) {
    const record = coop.loans.find((item) => item.id === recordId);
    if (record) return record;
  }
  throw new Error("We couldn't find that loan record");
}
