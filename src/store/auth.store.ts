import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticatedMember } from "@/types/auth";

interface AuthState {
  member: AuthenticatedMember | null;
  keepLoggedIn: boolean;
  hasHydrated: boolean;
  setMember: (member: AuthenticatedMember | null) => void;
  setKeepLoggedIn: (keepLoggedIn: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAvatarUrl: (avatarUrl: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      keepLoggedIn: false,
      hasHydrated: false,
      setMember: (member) => set({ member }),
      setKeepLoggedIn: (keepLoggedIn) => set({ keepLoggedIn }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAvatarUrl: (avatarUrl) =>
        set((state) =>
          state.member ? { member: { ...state.member, avatarUrl } } : state,
        ),
      logout: () => set({ member: null }),
    }),
    {
      name: "t-coop-auth",
      partialize: (state) => ({
        keepLoggedIn: state.keepLoggedIn,
        member: state.member,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
