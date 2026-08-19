import { apiClient } from "@/lib/axios";
import {
  coopSavingsBySummaryType,
  findCooperative,
  type CoopSavingsRecord,
} from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_COOPERATIVES === "true";

export interface CoopSavingsRecordFilters {
  memberId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

/**
 * Super-admin savings oversight (the `/co-operatives/[id]/savings/...` routes) — real backend
 * (SavingsController), not the mock/Zustand-backed personal savings model `/savings` still uses
 * for the admin/member self-service flow. See documentation/savings-page.md.
 */
export const coopSavingsService = {
  async getSavingsTypes(coopId: string): Promise<CoopSavingsTypeSummary[]> {
    if (USE_MOCK()) return mockGetSavingsTypes(coopId);
    const { data } = await apiClient.get<CoopSavingsTypeSummary[]>(
      `/cooperatives/${coopId}/savings/types`,
    );
    return data;
  },

  async getSavingsRecords(
    coopId: string,
    filters: CoopSavingsRecordFilters = {},
  ): Promise<CoopSavingsRecord[]> {
    if (USE_MOCK()) return mockGetSavingsRecords(coopId, filters);
    const { data } = await apiClient.get<CoopSavingsRecord[]>(
      `/cooperatives/${coopId}/savings`,
      { params: filters },
    );
    return data;
  },

  async getSavingsRecord(recordId: string): Promise<CoopSavingsRecord> {
    if (USE_MOCK()) return mockGetSavingsRecord(recordId);
    const { data } = await apiClient.get<CoopSavingsRecord>(
      `/savings/${recordId}`,
    );
    return data;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_COOPERATIVES back to "true" to use these instead.
async function mockGetSavingsTypes(
  coopId: string,
): Promise<CoopSavingsTypeSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coopSavingsBySummaryType(coop).map((type, index) => ({
    id: `mock-savings-type-${index}`,
    ...type,
    status: "Active" as const,
  }));
}

async function mockGetSavingsRecords(
  coopId: string,
  filters: CoopSavingsRecordFilters,
): Promise<CoopSavingsRecord[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coop.savings.filter((record) => {
    if (filters.memberId && record.memberId !== filters.memberId) return false;
    if (filters.type && record.savingsType !== filters.type) return false;
    if (filters.status && record.status !== filters.status) return false;
    if (filters.from && record.date < filters.from) return false;
    if (filters.to && record.date > filters.to) return false;
    return true;
  });
}

async function mockGetSavingsRecord(
  recordId: string,
): Promise<CoopSavingsRecord> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  for (const coop of useCoopStore.getState().cooperatives) {
    const record = coop.savings.find((item) => item.id === recordId);
    if (record) return record;
  }
  throw new Error("We couldn't find that savings record");
}
