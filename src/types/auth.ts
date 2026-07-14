export interface LoginRequest {
  membershipId: string;
  password: string;
  keepLoggedIn: boolean;
}

export type UserRole = "super_admin" | "admin" | "member";

export interface AuthenticatedMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
}

export interface LoginResponse {
  member: AuthenticatedMember;
  requiresOtp: boolean;
}
