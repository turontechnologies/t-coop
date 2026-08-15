import { apiClient } from "@/lib/axios";
import {
  getProfileData,
  updateProfileData,
  type ProfileRecord,
} from "@/lib/profile-data";
import type { ProfileFormValues } from "@/lib/validations/profile.schema";

export interface UpdateProfileRequest {
  memberId: string;
  values: ProfileFormValues;
}

export const profileService = {
  async getProfile(memberId: string): Promise<ProfileRecord> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_PROFILE === "true") {
      return mockGetProfile(memberId);
    }

    const { data } = await apiClient.get<ProfileRecord>("/profile");
    return data;
  },

  async updateProfile({
    memberId,
    values,
  }: UpdateProfileRequest): Promise<ProfileRecord> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_PROFILE === "true") {
      return mockUpdateProfile(memberId, values);
    }

    const { data } = await apiClient.patch<ProfileRecord>("/profile", values);
    return data;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_PROFILE back to "true" to use this instead.
async function mockGetProfile(memberId: string): Promise<ProfileRecord> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return getProfileData(memberId);
}

async function mockUpdateProfile(
  memberId: string,
  values: ProfileFormValues,
): Promise<ProfileRecord> {
  await new Promise((resolve) => setTimeout(resolve, 900));
  updateProfileData(memberId, values);
  return { ...values, membershipId: memberId };
}
