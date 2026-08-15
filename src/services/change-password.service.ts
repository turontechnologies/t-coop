import { apiClient } from "@/lib/axios";
import {
  updateMockUserPassword,
  verifyMockUserPassword,
} from "@/lib/mock-users";

export interface ChangePasswordRequest {
  memberId: string;
  currentPassword: string;
  newPassword: string;
}

export const changePasswordService = {
  async changePassword({
    memberId,
    currentPassword,
    newPassword,
  }: ChangePasswordRequest): Promise<void> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_PROFILE === "true") {
      return mockChangePassword(memberId, currentPassword, newPassword);
    }

    await apiClient.post("/profile/password", { currentPassword, newPassword });
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_PROFILE back to "true" to use this instead.
async function mockChangePassword(
  memberId: string,
  currentPassword: string,
  newPassword: string,
): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  if (!verifyMockUserPassword(memberId, currentPassword)) {
    throw new Error("Current password is incorrect");
  }
  updateMockUserPassword(memberId, newPassword);
}
