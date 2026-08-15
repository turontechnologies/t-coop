import { apiClient } from "@/lib/axios";
import type { AuditLogEntry } from "@/lib/audit-log-data";
import { useAuditLogStore } from "@/store/audit-log.store";

export const auditLogService = {
  async getEntries(): Promise<AuditLogEntry[]> {
    if (process.env.NEXT_PUBLIC_USE_MOCK_AUDIT_LOG === "true") {
      return mockGetEntries();
    }

    const { data } = await apiClient.get<AuditLogEntry[]>("/audit-log");
    return data;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_AUDIT_LOG back to "true" to use this instead.
async function mockGetEntries(): Promise<AuditLogEntry[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return useAuditLogStore.getState().entries;
}
