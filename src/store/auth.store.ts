import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { AuthenticatedMember } from "@/types/auth";

interface AuthState {
  member: AuthenticatedMember | null;
  /** The bearer token issued at login — attached to every API request by lib/axios.ts. */
  token: string | null;
  keepLoggedIn: boolean;
  hasHydrated: boolean;
  setMember: (member: AuthenticatedMember | null) => void;
  setToken: (token: string | null) => void;
  setKeepLoggedIn: (keepLoggedIn: boolean) => void;
  setHasHydrated: (hasHydrated: boolean) => void;
  setAvatarUrl: (avatarUrl: string) => void;
  logout: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      member: null,
      token: null,
      keepLoggedIn: false,
      hasHydrated: false,
      setMember: (member) => set({ member }),
      setToken: (token) => set({ token }),
      setKeepLoggedIn: (keepLoggedIn) => set({ keepLoggedIn }),
      setHasHydrated: (hasHydrated) => set({ hasHydrated }),
      setAvatarUrl: (avatarUrl) =>
        set((state) =>
          state.member ? { member: { ...state.member, avatarUrl } } : state,
        ),
      logout: () => set({ member: null, token: null }),
    }),
    {
      name: "t-coop-auth",
      partialize: (state) => ({
        keepLoggedIn: state.keepLoggedIn,
        member: state.member,
        token: state.token,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHasHydrated(true);
      },
    },
  ),
);
