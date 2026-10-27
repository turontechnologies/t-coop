import { apiClient } from "@/lib/axios";
import type {
  CooperativeBranding,
  CooperativeSummary,
} from "@/types/cooperative";
import type {
  AddCooperativeFormValues,
  EditCooperativeFormValues,
  TransferAdminFormValues,
} from "@/lib/validations/coop.schema";
import type { CoopBankAccountFormValues } from "@/lib/validations/admin-settings.schema";

export const cooperativeService = {
  async getCooperatives(): Promise<CooperativeSummary[]> {
    const { data } = await apiClient.get<CooperativeSummary[]>("/cooperatives");
    return data;
  },

  async getCooperative(id: string): Promise<CooperativeSummary> {
    const { data } = await apiClient.get<CooperativeSummary>(
      `/cooperatives/${id}`,
    );
    return data;
  },

  async createCooperative(
    values: AddCooperativeFormValues,
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.post<CooperativeSummary>(
      "/cooperatives",
      values,
    );
    return data;
  },

  async updateCooperative(
    id: string,
    values: EditCooperativeFormValues,
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}`,
      values,
    );
    return data;
  },

  async updateCooperativeStatus(
    id: string,
    status: "Active" | "Disabled",
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}/status`,
      { status },
    );
    return data;
  },

  async updateBankAccount(
    id: string,
    values: CoopBankAccountFormValues,
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.patch<CooperativeSummary>(
      `/cooperatives/${id}/bank-account`,
      { ...values, accountName: values.accountName ?? "" },
    );
    return data;
  },

  async getNextCoopId(): Promise<string> {
    const { data } = await apiClient.get<{ nextId: string }>(
      "/cooperatives/next-id",
    );
    return data.nextId;
  },

  async getNextMemberId(coopId: string): Promise<string> {
    const { data } = await apiClient.get<{ nextId: string }>(
      `/cooperatives/${coopId}/members/next-id`,
    );
    return data.nextId;
  },

  async transferAdmin(
    coopId: string,
    values: TransferAdminFormValues,
  ): Promise<CooperativeSummary> {
    const { data } = await apiClient.post<CooperativeSummary>(
      `/cooperatives/${coopId}/transfer-admin`,
      values,
    );
    return data;
  },

  /** Just name + logo — every role (admin, member, super admin) can call this for their own
   * co-op, unlike getCooperative which is admin/super-admin only. */
  async getBranding(coopId: string): Promise<CooperativeBranding> {
    const { data } = await apiClient.get<CooperativeBranding>(
      `/cooperatives/${coopId}/branding`,
    );
    return data;
  },

  async uploadLogo(coopId: string, file: File): Promise<string> {
    const formData = new FormData();
    formData.append("file", file);
    const { data } = await apiClient.post<{ url: string }>(
      `/cooperatives/${coopId}/logo`,
      formData,
      { headers: { "Content-Type": "multipart/form-data" } },
    );
    return data.url;
  },
};
