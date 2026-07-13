import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticatedMember } from "@/types/auth";

interface AuthState {
  member: AuthenticatedMember | null;
  keepLoggedIn: boolean;
  setMember: (member: AuthenticatedMember | null) => void;
  setKeepLoggedIn: (keepLoggedIn: boolean) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      keepLoggedIn: false,
      setMember: (member) => set({ member }),
      setKeepLoggedIn: (keepLoggedIn) => set({ keepLoggedIn }),
      logout: () => set({ member: null }),
    }),
    {
      name: "t-coop-auth",
      partialize: (state) => ({ keepLoggedIn: state.keepLoggedIn }),
    },
  ),
);
