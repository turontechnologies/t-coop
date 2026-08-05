import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INITIAL_AUDIT_LOG, type AuditLogEntry } from "@/lib/audit-log-data";

export const AUDIT_LOG_STORE_NAME = "tcoop-audit-log";

interface AuditLogState {
  entries: AuditLogEntry[];
  addEntry: (entry: AuditLogEntry) => void;
  updateLocation: (id: string, location: string) => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set) => ({
      entries: INITIAL_AUDIT_LOG,
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
      updateLocation: (id, location) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, location } : entry,
          ),
        })),
    }),
    {
      name: AUDIT_LOG_STORE_NAME,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
