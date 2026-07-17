import { updateProfileData, type ProfileRecord } from "@/lib/profile-data";
import type { ProfileFormValues } from "@/lib/validations/profile.schema";

export interface UpdateProfileRequest {
  memberId: string;
  values: ProfileFormValues;
}

export const profileService = {
  async updateProfile({
    memberId,
    values,
  }: UpdateProfileRequest): Promise<ProfileRecord> {
    // No backend is wired up yet — persists in-memory only, mirroring the
    // rest of this app's mock services (resets on a full page reload).
    await new Promise((resolve) => setTimeout(resolve, 900));
    updateProfileData(memberId, values);
    return { ...values, membershipId: memberId };
  },
};
