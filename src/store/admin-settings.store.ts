import { create } from "zustand";
import {
  computeInstallments,
  INITIAL_COOP_BANK_ACCOUNT,
  INITIAL_COOPERATIVE_SETTINGS,
  INITIAL_LOAN_TYPE_SETTINGS,
  INITIAL_SAVINGS_TYPE_SETTINGS,
  type CooperativeSettings,
  type CoopBankAccountSettings,
  type CoopLoanTypeSetting,
  type CoopSavingsTypeSetting,
  type SettingStatus,
} from "@/lib/admin-settings-data";
import { logActivity } from "@/lib/audit-log";

interface AdminSettingsState {
  cooperativeSettings: CooperativeSettings;
  coopBankAccount: CoopBankAccountSettings;
  savingsTypeSettings: CoopSavingsTypeSetting[];
  loanTypeSettings: CoopLoanTypeSetting[];

  updateCooperativeSettings: (values: CooperativeSettings) => void;
  updateCoopBankAccount: (values: CoopBankAccountSettings) => void;

  addSavingsTypeSetting: (setting: CoopSavingsTypeSetting) => void;
  updateSavingsTypeSetting: (
    id: string,
    updates: Omit<CoopSavingsTypeSetting, "id" | "status">,
  ) => void;
  setSavingsTypeStatus: (id: string, status: SettingStatus) => void;

  addLoanTypeSetting: (setting: CoopLoanTypeSetting) => void;
  updateLoanTypeSetting: (
    id: string,
    updates: Omit<CoopLoanTypeSetting, "id" | "status">,
  ) => void;
  setLoanTypeStatus: (id: string, status: SettingStatus) => void;
}

export const useAdminSettingsStore = create<AdminSettingsState>()(
  (set, get) => ({
    cooperativeSettings: INITIAL_COOPERATIVE_SETTINGS,
    coopBankAccount: INITIAL_COOP_BANK_ACCOUNT,
    savingsTypeSettings: INITIAL_SAVINGS_TYPE_SETTINGS,
    loanTypeSettings: INITIAL_LOAN_TYPE_SETTINGS,

    updateCooperativeSettings: (values) => {
      set({ cooperativeSettings: values });
      logActivity({
        module: "Settings",
        action: "Update",
        resource: "Co-operative Details",
      });
    },
    updateCoopBankAccount: (values) => {
      set({ coopBankAccount: values });
      logActivity({
        module: "Settings",
        action: "Update",
        resource: "Co-operative Bank Account",
      });
    },

    addSavingsTypeSetting: (setting) => {
      set((state) => ({
        savingsTypeSettings: [setting, ...state.savingsTypeSettings],
      }));
      logActivity({
        module: "Settings",
        action: "Create",
        resource: `Savings Type — ${setting.name}`,
      });
    },
    updateSavingsTypeSetting: (id, updates) => {
      set((state) => ({
        savingsTypeSettings: state.savingsTypeSettings.map((setting) =>
          setting.id === id ? { ...setting, ...updates } : setting,
        ),
      }));
      logActivity({
        module: "Settings",
        action: "Update",
        resource: `Savings Type — ${updates.name}`,
      });
    },
    setSavingsTypeStatus: (id, status) => {
      const setting = get().savingsTypeSettings.find((s) => s.id === id);
      set((state) => ({
        savingsTypeSettings: state.savingsTypeSettings.map((s) =>
          s.id === id ? { ...s, status } : s,
        ),
      }));
      if (setting) {
        logActivity({
          module: "Settings",
          action: "Update",
          resource: `Savings Type — ${setting.name}`,
          status: status === "Active" ? "Success" : "Warning",
        });
      }
    },

    addLoanTypeSetting: (setting) => {
      set((state) => ({
        loanTypeSettings: [setting, ...state.loanTypeSettings],
      }));
      logActivity({
        module: "Settings",
        action: "Create",
        resource: `Loan Type — ${setting.name}`,
      });
    },
    updateLoanTypeSetting: (id, updates) => {
      set((state) => ({
        loanTypeSettings: state.loanTypeSettings.map((setting) =>
          setting.id === id ? { ...setting, ...updates } : setting,
        ),
      }));
      logActivity({
        module: "Settings",
        action: "Update",
        resource: `Loan Type — ${updates.name}`,
      });
    },
    setLoanTypeStatus: (id, status) => {
      const setting = get().loanTypeSettings.find((l) => l.id === id);
      set((state) => ({
        loanTypeSettings: state.loanTypeSettings.map((l) =>
          l.id === id ? { ...l, status } : l,
        ),
      }));
      if (setting) {
        logActivity({
          module: "Settings",
          action: "Update",
          resource: `Loan Type — ${setting.name}`,
          status: status === "Active" ? "Success" : "Warning",
        });
      }
    },
  }),
);

export { computeInstallments };
