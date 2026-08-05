import { create } from "zustand";
import {
  INITIAL_COLLECTION_ACCOUNT,
  INITIAL_FEE_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_PLATFORM_ROLES,
  INITIAL_PLATFORM_USERS,
  type CollectionAccountSettings,
  type FeeSettings,
  type IntegrationSettings,
  type PlatformRole,
  type PlatformRoleStatus,
  type PlatformUser,
  type PlatformUserStatus,
} from "@/lib/settings-data";
import { logActivity } from "@/lib/audit-log";

interface SettingsState {
  feeSettings: FeeSettings;
  collectionAccount: CollectionAccountSettings;
  integrations: IntegrationSettings;
  platformUsers: PlatformUser[];
  platformRoles: PlatformRole[];
  updateFeeSettings: (values: FeeSettings) => void;
  updateCollectionAccount: (values: CollectionAccountSettings) => void;
  updateIntegrations: (values: IntegrationSettings) => void;
  inviteUser: (user: PlatformUser) => void;
  updatePlatformUserRole: (userId: string, role: string) => void;
  setPlatformUserStatus: (userId: string, status: PlatformUserStatus) => void;
  removePlatformUser: (userId: string) => void;
  createRole: (role: PlatformRole) => void;
  updatePlatformRole: (
    roleId: string,
    updates: { name: string; permissions: string[] },
  ) => void;
  setPlatformRoleStatus: (roleId: string, status: PlatformRoleStatus) => void;
  removePlatformRole: (roleId: string) => void;
}

export const useSettingsStore = create<SettingsState>()((set, get) => ({
  feeSettings: INITIAL_FEE_SETTINGS,
  collectionAccount: INITIAL_COLLECTION_ACCOUNT,
  integrations: INITIAL_INTEGRATIONS,
  platformUsers: INITIAL_PLATFORM_USERS,
  platformRoles: INITIAL_PLATFORM_ROLES,

  updateFeeSettings: (values) => {
    set({ feeSettings: values });
    logActivity("Fees & charges updated");
  },
  updateCollectionAccount: (values) => {
    set({ collectionAccount: values });
    logActivity("Collections account updated");
  },
  updateIntegrations: (values) => {
    set({ integrations: values });
    logActivity("Integrations updated");
  },

  inviteUser: (user) => {
    set((state) => ({ platformUsers: [user, ...state.platformUsers] }));
    logActivity(`User invited: ${user.email} (${user.role})`);
  },
  updatePlatformUserRole: (userId, role) => {
    const user = get().platformUsers.find((u) => u.id === userId);
    set((state) => ({
      platformUsers: state.platformUsers.map((u) =>
        u.id === userId ? { ...u, role } : u,
      ),
    }));
    if (user) logActivity(`User role changed: ${user.name} → ${role}`);
  },
  setPlatformUserStatus: (userId, status) => {
    const user = get().platformUsers.find((u) => u.id === userId);
    set((state) => ({
      platformUsers: state.platformUsers.map((u) =>
        u.id === userId ? { ...u, status } : u,
      ),
    }));
    if (user) {
      logActivity(
        `User ${status === "Active" ? "activated" : "disabled"}: ${user.name}`,
      );
    }
  },
  removePlatformUser: (userId) => {
    const user = get().platformUsers.find((u) => u.id === userId);
    set((state) => ({
      platformUsers: state.platformUsers.filter((u) => u.id !== userId),
    }));
    if (user) logActivity(`User removed: ${user.name}`);
  },

  createRole: (role) => {
    set((state) => ({ platformRoles: [role, ...state.platformRoles] }));
    logActivity(`Role created: ${role.name}`);
  },
  updatePlatformRole: (roleId, updates) => {
    set((state) => ({
      platformRoles: state.platformRoles.map((role) =>
        role.id === roleId ? { ...role, ...updates } : role,
      ),
    }));
    logActivity(`Role updated: ${updates.name}`);
  },
  setPlatformRoleStatus: (roleId, status) => {
    const role = get().platformRoles.find((r) => r.id === roleId);
    set((state) => ({
      platformRoles: state.platformRoles.map((r) =>
        r.id === roleId ? { ...r, status } : r,
      ),
    }));
    if (role) {
      logActivity(
        `Role ${status === "Active" ? "activated" : "disabled"}: ${role.name}`,
      );
    }
  },
  removePlatformRole: (roleId) => {
    const role = get().platformRoles.find((r) => r.id === roleId);
    set((state) => ({
      platformRoles: state.platformRoles.filter((r) => r.id !== roleId),
    }));
    if (role) logActivity(`Role removed: ${role.name}`);
  },
}));
