import { apiClient } from "@/lib/axios";
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
    const { data } = await apiClient.post<LoginResponse>(
      "/auth/login",
      payload,
    );
    return data;
  },

  /**
   * Re-fetches the signed-in member — used to pick up subscription status
   * changes made by a super admin (renewal, disable) without requiring a
   * fresh login.
   */
  async me(): Promise<AuthenticatedMember> {
    const { data } = await apiClient.get<AuthenticatedMember>("/auth/me");
    return data;
  },

  async logout(): Promise<void> {
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
    const { data } = await apiClient.post<PasswordResetResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  async verifyOtp(payload: VerifyOtpRequest): Promise<VerifyOtpResponse> {
    const { data } = await apiClient.post<VerifyOtpResponse>(
      "/auth/verify-otp",
      payload,
    );
    return data;
  },

  async resetPassword(
    payload: ResetPasswordRequest,
  ): Promise<ResetPasswordResponse> {
    const { data } = await apiClient.post<ResetPasswordResponse>(
      "/auth/reset-password",
      payload,
    );
    return data;
  },
};
