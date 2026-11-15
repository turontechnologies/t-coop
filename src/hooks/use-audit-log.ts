import { keepPreviousData, useMutation, useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log.service";
import type { AuditLogFilters } from "@/lib/audit-log-data";

/** One page of the audit log; the previous page stays on screen while the next one loads. */
export function useAuditLog(
  filters: AuditLogFilters,
  page: number,
  size: number,
) {
  return useQuery({
    queryKey: ["audit-log", filters, page, size],
    queryFn: () => auditLogService.getPage(filters, page, size),
    placeholderData: keepPreviousData,
    staleTime: 15_000,
    refetchInterval: 60_000,
  });
}

export function useExportAuditLog() {
  return useMutation({
    mutationFn: (filters: AuditLogFilters) =>
      auditLogService.exportCsv(filters),
  });
}
