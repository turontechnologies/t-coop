export interface LoginRequest {
  membershipId: string;
  password: string;
  keepLoggedIn: boolean;
}

export interface AuthenticatedMember {
  id: string;
  name: string;
  email: string;
  role: string;
}

export interface LoginResponse {
  member: AuthenticatedMember;
  requiresOtp: boolean;
}
