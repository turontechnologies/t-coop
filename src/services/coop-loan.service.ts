import { apiClient } from "@/lib/axios";
import {
  coopLoansBySummaryType,
  findCooperative,
  type CoopLoanRecord,
} from "@/lib/coop-data";
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
 * Super-admin loans oversight (the `/co-operatives/[id]/loans/...` routes) — real backend
 * (LoanController), not the mock/Zustand-backed personal loans model `/loans` still uses for the
 * admin/member self-service flow. Mirrors coop-savings.service.ts exactly.
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
};

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
