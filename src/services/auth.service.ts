import { apiClient } from "@/lib/axios";
import { MOCK_USERS } from "@/lib/mock-users";
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

// No backend is wired up yet — this mock keeps the login flow demoable
// against the three hardcoded role accounts in src/lib/mock-users.ts.
// Remove once NEXT_PUBLIC_API_URL points at a real auth endpoint.
async function mockLogin({
  membershipId,
  password,
}: LoginRequest): Promise<LoginResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const match = MOCK_USERS.find(
    (user) =>
      user.membershipId.toLowerCase() === membershipId.trim().toLowerCase() &&
      user.password === password,
  );

  if (!match) {
    throw new Error("Invalid membership ID or password.");
  }

  return {
    member: match.member,
    requiresOtp: false,
  };
}
