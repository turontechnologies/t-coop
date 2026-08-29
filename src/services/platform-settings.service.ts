import { apiClient } from "@/lib/axios";
import { logActivity } from "@/lib/audit-log";
import type {
  CollectionAccountSettings,
  FeeSettings,
  IntegrationSettings,
} from "@/lib/settings-data";
import { useSettingsStore } from "@/store/settings.store";
import type { IdGenerationType } from "@/types/cooperative";

const USE_MOCK = () => process.env.NEXT_PUBLIC_USE_MOCK_SETTINGS === "true";

export const platformSettingsService = {
  async getFeeSettings(): Promise<FeeSettings> {
    if (USE_MOCK())
      return mockGet(() => useSettingsStore.getState().feeSettings);
    const { data } = await apiClient.get<FeeSettings>("/settings/fees");
    return data;
  },

  async updateFeeSettings(values: FeeSettings): Promise<FeeSettings> {
    if (USE_MOCK()) {
      return mockUpdate(values, (v) => {
        useSettingsStore.setState({ feeSettings: v });
        logActivity({
          module: "Settings",
          action: "Update",
          resource: "Fees & Charges",
        });
      });
    }
    const { data } = await apiClient.patch<FeeSettings>(
      "/settings/fees",
      values,
    );
    return data;
  },

  async getCollectionAccount(): Promise<CollectionAccountSettings> {
    if (USE_MOCK())
      return mockGet(() => useSettingsStore.getState().collectionAccount);
    const { data } = await apiClient.get<CollectionAccountSettings>(
      "/settings/collection-account",
    );
    return data;
  },

  async updateCollectionAccount(
    values: CollectionAccountSettings,
  ): Promise<CollectionAccountSettings> {
    if (USE_MOCK()) {
      return mockUpdate(values, (v) => {
        useSettingsStore.setState({ collectionAccount: v });
        logActivity({
          module: "Settings",
          action: "Update",
          resource: "Collections Account",
        });
      });
    }
    const { data } = await apiClient.patch<CollectionAccountSettings>(
      "/settings/collection-account",
      values,
    );
    return data;
  },

  async getIntegrationSettings(): Promise<IntegrationSettings> {
    if (USE_MOCK())
      return mockGet(() => useSettingsStore.getState().integrations);
    const { data } = await apiClient.get<IntegrationSettings>(
      "/settings/integrations",
    );
    return data;
  },

  async updateIntegrationSettings(
    values: IntegrationSettings,
  ): Promise<IntegrationSettings> {
    if (USE_MOCK()) {
      return mockUpdate(values, (v) => {
        useSettingsStore.setState({ integrations: v });
        logActivity({
          module: "Settings",
          action: "Update",
          resource: "Integrations",
        });
      });
    }
    const { data } = await apiClient.patch<IntegrationSettings>(
      "/settings/integrations",
      values,
    );
    return data;
  },

  async getWithdrawalFee(): Promise<
    Pick<FeeSettings, "withdrawalFeeAmount" | "withdrawalFeeType">
  > {
    if (USE_MOCK()) {
      return mockGet(() => {
        const { withdrawalFeeAmount, withdrawalFeeType } =
          useSettingsStore.getState().feeSettings;
        return { withdrawalFeeAmount, withdrawalFeeType };
      });
    }
    const { data } = await apiClient.get<
      Pick<FeeSettings, "withdrawalFeeAmount" | "withdrawalFeeType">
    >("/settings/withdrawal-fee");
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

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_SETTINGS back to "true" to use this instead.
async function mockGet<T>(read: () => T): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return read();
}

async function mockUpdate<T>(
  values: T,
  apply: (values: T) => void,
): Promise<T> {
  await new Promise((resolve) => setTimeout(resolve, 600));
  apply(values);
  return values;
}
