import { create } from "zustand";
import { createJSONStorage, persist } from "zustand/middleware";
import { INITIAL_AUDIT_LOG, type AuditLogEntry } from "@/lib/audit-log-data";

// Bumped when the entry shape changes (module/action/resource/status/ipAddress
// added) — old localStorage data under the previous key doesn't match this
// shape and would crash the Logs UI, so it's simplest to start fresh under a
// new key rather than write a migration for pre-release demo data.
export const AUDIT_LOG_STORE_NAME = "tcoop-audit-log-v2";

interface AuditLogState {
  entries: AuditLogEntry[];
  addEntry: (entry: AuditLogEntry) => void;
  resolveLocation: (id: string, location: string, ipAddress: string) => void;
}

export const useAuditLogStore = create<AuditLogState>()(
  persist(
    (set) => ({
      entries: INITIAL_AUDIT_LOG,
      addEntry: (entry) =>
        set((state) => ({ entries: [entry, ...state.entries] })),
      resolveLocation: (id, location, ipAddress) =>
        set((state) => ({
          entries: state.entries.map((entry) =>
            entry.id === id ? { ...entry, location, ipAddress } : entry,
          ),
        })),
    }),
    {
      name: AUDIT_LOG_STORE_NAME,
      storage: createJSONStorage(() => localStorage),
    },
  ),
);
