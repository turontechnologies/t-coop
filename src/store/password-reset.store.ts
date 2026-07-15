import { create } from "zustand";
import type { AuthenticatedMember } from "@/types/auth";

interface PasswordResetState {
  email: string | null;
  otp: string | null;
  member: AuthenticatedMember | null;
  setResetSession: (
    email: string,
    otp: string,
    member: AuthenticatedMember,
  ) => void;
  verifyOtp: (code: string) => boolean;
  clear: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>()(
  (set, get) => ({
    email: null,
    otp: null,
    member: null,
    setResetSession: (email, otp, member) => set({ email, otp, member }),
    verifyOtp: (code) => code.trim() === get().otp,
    clear: () => set({ email: null, otp: null, member: null }),
  }),
);
