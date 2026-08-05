import { create } from "zustand";
import {
  INITIAL_ACTIVITY_LOG,
  INITIAL_COLLECTION_ACCOUNT,
  INITIAL_FEE_SETTINGS,
  INITIAL_INTEGRATIONS,
  INITIAL_PLATFORM_ROLES,
  INITIAL_PLATFORM_USERS,
  type ActivityLogEntry,
  type CollectionAccountSettings,
  type FeeSettings,
  type IntegrationSettings,
  type PlatformRole,
  type PlatformUser,
} from "@/lib/settings-data";

interface SettingsState {
  feeSettings: FeeSettings;
  collectionAccount: CollectionAccountSettings;
  integrations: IntegrationSettings;
  platformUsers: PlatformUser[];
  platformRoles: PlatformRole[];
  activityLog: ActivityLogEntry[];
  updateFeeSettings: (values: FeeSettings) => void;
  updateCollectionAccount: (values: CollectionAccountSettings) => void;
  updateIntegrations: (values: IntegrationSettings) => void;
  inviteUser: (user: PlatformUser) => void;
  createRole: (role: PlatformRole) => void;
}

export const useSettingsStore = create<SettingsState>()((set) => ({
  feeSettings: INITIAL_FEE_SETTINGS,
  collectionAccount: INITIAL_COLLECTION_ACCOUNT,
  integrations: INITIAL_INTEGRATIONS,
  platformUsers: INITIAL_PLATFORM_USERS,
  platformRoles: INITIAL_PLATFORM_ROLES,
  activityLog: INITIAL_ACTIVITY_LOG,
  updateFeeSettings: (values) => set({ feeSettings: values }),
  updateCollectionAccount: (values) => set({ collectionAccount: values }),
  updateIntegrations: (values) => set({ integrations: values }),
  inviteUser: (user) =>
    set((state) => ({ platformUsers: [user, ...state.platformUsers] })),
  createRole: (role) =>
    set((state) => ({ platformRoles: [role, ...state.platformRoles] })),
}));
