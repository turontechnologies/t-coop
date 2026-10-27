import { apiClient } from "@/lib/axios";
import type { CoopSavingsRecord } from "@/lib/coop-data";
import type { SavingsTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import type { CoopSavingsTypeSummary } from "@/types/coop-savings";

export interface CoopSavingsRecordFilters {
  memberId?: string;
  type?: string;
  status?: string;
  from?: string;
  to?: string;
}

/**
 * Savings oversight (the `/co-operatives/[id]/savings/...` routes, and — since `SavingsController`
 * scopes access down for non-staff callers — the record list/detail these hooks also back on the
 * admin/member self-service `/savings` pages). The self-service mutations (deposit, withdrawal
 * request/decision) live in `savings-self.service.ts` against `SavingsSelfServiceController`.
 */
export const coopSavingsService = {
  async getSavingsTypes(coopId: string): Promise<CoopSavingsTypeSummary[]> {
    const { data } = await apiClient.get<CoopSavingsTypeSummary[]>(
      `/cooperatives/${coopId}/savings/types`,
    );
    return data;
  },

  async getSavingsRecords(
    coopId: string,
    filters: CoopSavingsRecordFilters = {},
  ): Promise<CoopSavingsRecord[]> {
    const { data } = await apiClient.get<CoopSavingsRecord[]>(
      `/cooperatives/${coopId}/savings`,
      { params: filters },
    );
    return data;
  },

  async getSavingsRecord(recordId: string): Promise<CoopSavingsRecord> {
    const { data } = await apiClient.get<CoopSavingsRecord>(
      `/savings/${recordId}`,
    );
    return data;
  },

  async createSavingsType(
    coopId: string,
    values: SavingsTypeSettingFormValues,
  ): Promise<CoopSavingsTypeSummary> {
    const { data } = await apiClient.post<CoopSavingsTypeSummary>(
      `/cooperatives/${coopId}/savings/types`,
      { name: values.name, minAmount: values.min, maxAmount: values.max },
    );
    return data;
  },

  async updateSavingsType(
    coopId: string,
    typeId: string,
    values: SavingsTypeSettingFormValues,
  ): Promise<CoopSavingsTypeSummary> {
    const { data } = await apiClient.patch<CoopSavingsTypeSummary>(
      `/cooperatives/${coopId}/savings/types/${typeId}`,
      { name: values.name, minAmount: values.min, maxAmount: values.max },
    );
    return data;
  },

  async updateSavingsTypeStatus(
    coopId: string,
    typeId: string,
    status: "Active" | "Inactive",
  ): Promise<CoopSavingsTypeSummary> {
    const { data } = await apiClient.patch<CoopSavingsTypeSummary>(
      `/cooperatives/${coopId}/savings/types/${typeId}/status`,
      { status },
    );
    return data;
  },
};
