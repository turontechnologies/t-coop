import { useQuery } from "@tanstack/react-query";
import { auditLogService } from "@/services/audit-log.service";

export function useAuditLog() {
  return useQuery({
    queryKey: ["audit-log"],
    queryFn: () => auditLogService.getEntries(),
    staleTime: 30_000,
  });
}
