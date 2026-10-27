import { apiClient } from "@/lib/axios";
import type { AuditLogEntry } from "@/lib/audit-log-data";

export const auditLogService = {
  async getEntries(): Promise<AuditLogEntry[]> {
    const { data } = await apiClient.get<AuditLogEntry[]>("/audit-log");
    return data;
  },
};
