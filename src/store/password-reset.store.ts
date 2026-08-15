import { create } from "zustand";

interface PasswordResetState {
  email: string | null;
  /** Issued by /auth/verify-otp once the code checks out — required to actually reset the password. */
  resetToken: string | null;
  setEmail: (email: string) => void;
  setResetToken: (resetToken: string) => void;
  clear: () => void;
}

export const usePasswordResetStore = create<PasswordResetState>()((set) => ({
  email: null,
  resetToken: null,
  setEmail: (email) => set({ email, resetToken: null }),
  setResetToken: (resetToken) => set({ resetToken }),
  clear: () => set({ email: null, resetToken: null }),
}));
