import { apiClient } from "@/lib/axios";

export interface ChangePasswordRequest {
  currentPassword: string;
  newPassword: string;
}

export const changePasswordService = {
  async changePassword({
    currentPassword,
    newPassword,
  }: ChangePasswordRequest): Promise<void> {
    await apiClient.post("/profile/password", { currentPassword, newPassword });
  },
};
