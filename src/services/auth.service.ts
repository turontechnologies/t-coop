import { apiClient } from "@/lib/axios";
import { MOCK_USERS } from "@/lib/mock-users";
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
} from "@/types/auth";

export const authService = {
  async login(payload: LoginRequest): Promise<LoginResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_LOGIN === "true") {
      return mockLogin(payload);
    }

    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  async logout(): Promise<void> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_LOGIN === "true") {
      return;
    }

    // JWTs are stateless server-side, so this call has nothing to "undo" —
    // it exists so logout is audit-logged on the backend. If it fails (e.g.
    // tunnel down), the caller still clears local state; we don't block
    // logout on network calls succeeding.
    try {
      await apiClient.post("/auth/logout");
    } catch {
      // Intentionally swallowed — see comment above.
    }
  },

  async requestPasswordReset(
    payload: PasswordResetRequest,
  ): Promise<PasswordResetResponse> {
    // The real backend doesn't implement forgot-password yet (see
    // documentation/api-contracts.md §1) — mocked independently of login,
    // which does hit the real backend, so this flag stays "true" even
    // after login goes live.
    if (process.env.NEXT_PUBLIC_USE_MOCK_PASSWORD_RESET === "true") {
      return mockRequestPasswordReset(payload);
    }

    const { data } = await apiClient.post<PasswordResetResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_LOGIN back to "true" to use this instead.
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
    token: "mock-token",
  };
}

async function mockRequestPasswordReset({
  email,
}: PasswordResetRequest): Promise<PasswordResetResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const match = MOCK_USERS.find(
    (user) => user.member.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!match) {
    throw new Error(
      "We couldn't find an account with that email address. Please enter a valid registered email.",
    );
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));

  return {
    member: match.member,
    otp,
  };
}
