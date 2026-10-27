import { apiClient } from "@/lib/axios";
import type { ProfileRecord } from "@/lib/profile-data";
import type { ProfileFormValues } from "@/lib/validations/profile.schema";

export const profileService = {
  async getProfile(): Promise<ProfileRecord> {
    const { data } = await apiClient.get<ProfileRecord>("/profile");
    return data;
  },

  async updateProfile(values: ProfileFormValues): Promise<ProfileRecord> {
    const { data } = await apiClient.patch<ProfileRecord>("/profile", values);
    return data;
  },
};
