import { apiClient } from "@/lib/axios";
import type {
  CollectionAccountSettings,
  CoopPlatformFees,
  EarningEntry,
  EarningsSummary,
  FeeSettings,
  IntegrationSettings,
} from "@/lib/settings-data";
import type { CoopPlatformFeesFormValues } from "@/lib/validations/settings.schema";
import type { IdGenerationType } from "@/types/cooperative";

export const platformSettingsService = {
  async getFeeSettings(): Promise<FeeSettings> {
    const { data } = await apiClient.get<FeeSettings>("/settings/fees");
    return data;
  },

  async updateFeeSettings(values: FeeSettings): Promise<FeeSettings> {
    const { data } = await apiClient.patch<FeeSettings>(
      "/settings/fees",
      values,
    );
    return data;
  },

  async getCollectionAccount(): Promise<CollectionAccountSettings> {
    const { data } = await apiClient.get<CollectionAccountSettings>(
      "/settings/collection-account",
    );
    return data;
  },

  async updateCollectionAccount(
    values: CollectionAccountSettings,
  ): Promise<CollectionAccountSettings> {
    const { data } = await apiClient.patch<CollectionAccountSettings>(
      "/settings/collection-account",
      values,
    );
    return data;
  },

  async getIntegrationSettings(): Promise<IntegrationSettings> {
    const { data } = await apiClient.get<IntegrationSettings>(
      "/settings/integrations",
    );
    return data;
  },

  async updateIntegrationSettings(
    values: IntegrationSettings,
  ): Promise<IntegrationSettings> {
    const { data } = await apiClient.patch<IntegrationSettings>(
      "/settings/integrations",
      values,
    );
    return data;
  },

  async getWithdrawalFee(): Promise<
    Pick<FeeSettings, "withdrawalFeeAmount" | "withdrawalFeeType">
  > {
    const { data } = await apiClient.get<
      Pick<FeeSettings, "withdrawalFeeAmount" | "withdrawalFeeType">
    >("/settings/withdrawal-fee");
    return data;
  },

  async getCoopPlatformFees(): Promise<CoopPlatformFees[]> {
    const { data } = await apiClient.get<CoopPlatformFees[]>("/platform-fees");
    return data;
  },

  async updateCoopPlatformFees(
    cooperativeId: string,
    values: CoopPlatformFeesFormValues,
  ): Promise<CoopPlatformFees> {
    const { data } = await apiClient.patch<CoopPlatformFees>(
      `/platform-fees/${encodeURIComponent(cooperativeId)}`,
      values,
    );
    return data;
  },

  async getEarnings(from: string, to: string): Promise<EarningsSummary> {
    const { data } = await apiClient.get<EarningsSummary>(
      "/platform-earnings",
      { params: { from, to } },
    );
    return data;
  },

  async getCoopEarnings(
    cooperativeId: string,
    from: string,
    to: string,
  ): Promise<EarningEntry[]> {
    const { data } = await apiClient.get<EarningEntry[]>(
      `/platform-earnings/${encodeURIComponent(cooperativeId)}`,
      { params: { from, to } },
    );
    return data;
  },

  async getCoopIdFormat(): Promise<CoopIdFormat> {
    const { data } = await apiClient.get<CoopIdFormat>(
      "/settings/coop-id-format",
    );
    return data;
  },

  async updateCoopIdFormat(values: CoopIdFormat): Promise<CoopIdFormat> {
    const { data } = await apiClient.patch<CoopIdFormat>(
      "/settings/coop-id-format",
      values,
    );
    return data;
  },
};

export interface CoopIdFormat {
  prefix: string;
  padding: number;
  type: IdGenerationType;
}
