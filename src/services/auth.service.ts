import { apiClient } from "@/lib/axios";
import type { LoginRequest, LoginResponse } from "@/types/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true") {
      return mockLogin(payload);
    }

    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },
};

// No backend is wired up yet — this mock keeps the login flow demoable.
// Remove once NEXT_PUBLIC_API_URL points at a real auth endpoint.
async function mockLogin({
  membershipId,
  password,
}: LoginRequest): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  if (password.length < 6) {
    throw new Error("Invalid membership ID or password.");
  }

  return {
    member: {
      id: membershipId,
      name: "Member",
      email: "member@example.com",
      role: "member",
    },
    requiresOtp: true,
  };
}
