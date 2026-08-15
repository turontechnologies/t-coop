import { apiClient } from "@/lib/axios";
import { MOCK_USERS, updateMockUserPassword } from "@/lib/mock-users";
import type {
  AuthenticatedMember,
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  ResetPasswordRequest,
  ResetPasswordResponse,
  VerifyOtpRequest,
  VerifyOtpResponse,
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
    if (process.env.NEXT_PUBLIC_USE_MOCK_PASSWORD_RESET === "true") {
      return mockRequestPasswordReset(payload);
    }

    const { data } = await apiClient.post<PasswordResetResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_PASSWORD_RESET === "true") {
      return mockVerifyOtp(payload);
    }

    const { data } = await apiClient.post<VerifyOtpResponse>(
      "/auth/verify-otp",
      payload,
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_PASSWORD_RESET === "true") {
      return mockResetPassword(payload);
    }

    const { data } = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
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

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_PASSWORD_RESET back to "true" to use these instead.
// Since there's no real email being sent in mock mode, the OTP/member are
// returned directly in the response so the UI can show a "here's what the
// email would say" preview (see forgot-password/page.tsx).
interface MockResetSession {
  otp: string;
  member: AuthenticatedMember;
  resetToken?: string;
}
const mockResetSessions = new Map<string, MockResetSession>();

async function mockRequestPasswordReset({
  email,
}: PasswordResetRequest): Promise<PasswordResetResponse> {
  await new Promise((resolve) => setTimeout(resolve, 900));

  const match = MOCK_USERS.find(
    (user) => user.member.email.toLowerCase() === email.trim().toLowerCase(),
  );

  if (!match) {
    throw new Error("We couldn't find an account with that email address");
  }

  const otp = String(Math.floor(100000 + Math.random() * 900000));
  mockResetSessions.set(email.trim().toLowerCase(), {
    otp,
    member: match.member,
  });

  return { message: "OTP sent", otp, member: match.member };
}

async function mockVerifyOtp({
  email,
  otp,
}: VerifyOtpRequest): Promise<VerifyOtpResponse> {
  await new Promise((resolve) => setTimeout(resolve, 500));

  const key = email.trim().toLowerCase();
  const session = mockResetSessions.get(key);
  if (!session || session.otp !== otp.trim()) {
    throw new Error("Incorrect OTP. Please try again.");
  }

  const resetToken = `mock-${key}-${Date.now()}`;
  session.resetToken = resetToken;
  return { resetToken };
}

async function mockResetPassword({
  resetToken,
  newPassword,
}: ResetPasswordRequest): Promise<ResetPasswordResponse> {
  await new Promise((resolve) => setTimeout(resolve, 600));

  const session = [...mockResetSessions.values()].find(
    (entry) => entry.resetToken === resetToken,
  );
  if (!session) {
    throw new Error("This reset link has expired. Please request a new OTP.");
  }

  updateMockUserPassword(session.member.id, newPassword);
  return { message: "Password updated" };
}
