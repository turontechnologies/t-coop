export interface LoginRequest {
  membershipId: string;
  password: string;
  keepLoggedIn: boolean;
}

export type UserRole = "super_admin" | "admin" | "member" | "support";

export interface AuthenticatedMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  /** Only ever set for role "admin" — null for super_admin/member. */
  subscriptionActive?: boolean | null;
  subscriptionExpiresAt?: string | null;
  /** Only ever set for role "support" (platform staff) — the modules their assigned
   * PlatformRole grants access to. Null for every other role. */
  permissionModules?: string[] | null;
}

export interface LoginResponse {
  member: AuthenticatedMember;
  token: string;
}

export interface PasswordResetRequest {
  email: string;
}

export interface PasswordResetResponse {
  message: string;
  /** Only populated by the mock path — no real backend ever returns these. */
  otp?: string;
  member?: AuthenticatedMember;
}

export interface VerifyOtpRequest {
  email: string;
  otp: string;
}

export interface VerifyOtpResponse {
  resetToken: string;
}

export interface ResetPasswordRequest {
  resetToken: string;
  newPassword: string;
}

export interface ResetPasswordResponse {
  message: string;
}
