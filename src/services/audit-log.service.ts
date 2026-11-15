import { apiClient } from "@/lib/axios";
import type { AuditLogFilters, AuditLogPage } from "@/lib/audit-log-data";

function params(filters: AuditLogFilters) {
  return Object.fromEntries(
    Object.entries(filters).filter(
      ([, value]) => value != null && value !== "",
    ),
  );
}

export const auditLogService = {
  /** One page of the audit log (page is zero-based), newest first. */
  async getPage(
    filters: AuditLogFilters,
    page: number,
    size: number,
  ): Promise<AuditLogPage> {
    const { data } = await apiClient.get<AuditLogPage>("/audit-log", {
      params: { ...params(filters), page, size },
    });
    return data;
  },

  /** Every entry matching the filters as a CSV file, saved through the browser. */
  async exportCsv(filters: AuditLogFilters): Promise<void> {
    const response = await apiClient.get<Blob>("/audit-log/export", {
      params: params(filters),
      responseType: "blob",
      timeout: 300_000,
    });
    const disposition = String(response.headers["content-disposition"] ?? "");
    const name =
      /filename="?([^";]+)"?/.exec(disposition)?.[1] ??
      `t-coop-activity-log-${new Date().toISOString().slice(0, 10)}.csv`;
    const url = URL.createObjectURL(response.data);
    const link = document.createElement("a");
    link.href = url;
    link.download = name;
    document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => URL.revokeObjectURL(url), 1_000);
  },
};
