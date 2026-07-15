import { apiClient } from "@/lib/axios";
import { MOCK_USERS } from "@/lib/mock-users";
import type {
  LoginRequest,
  LoginResponse,
  PasswordResetRequest,
  PasswordResetResponse,
  RegisterCooperativeRequest,
  RegisterCooperativeResponse,
} from "@/types/auth";

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

  async requestPasswordReset(
    payload: PasswordResetRequest,
  ): Promise<PasswordResetResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true") {
      return mockRequestPasswordReset(payload);
    }

    const { data } = await apiClient.post<PasswordResetResponse>(
      "/auth/forgot-password",
      payload,
    );
    return data;
  },

  async registerCooperative(
    payload: RegisterCooperativeRequest,
  ): Promise<RegisterCooperativeResponse> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_AUTH === "true") {
      return mockRegisterCooperative(payload);
    }

    const { data } = await apiClient.post<RegisterCooperativeResponse>(
      "/auth/register",
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

async function mockRegisterCooperative({
  membershipId,
}: RegisterCooperativeRequest): Promise<RegisterCooperativeResponse> {
  await new Promise((resolve) => setTimeout(resolve, 1100));

  const isTaken = MOCK_USERS.some(
    (user) =>
      user.membershipId.toLowerCase() === membershipId.trim().toLowerCase(),
  );

  if (isTaken) {
    throw new Error(
      "That membership ID is already registered. Please choose another.",
    );
  }

  return { membershipId };
}
