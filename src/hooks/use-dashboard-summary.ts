import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type { UserRole } from "@/types/auth";

export function useDashboardSummary(role: UserRole | undefined) {
  return useQuery({
    queryKey: ["dashboard-summary", role],
    queryFn: () => dashboardService.getSummary(role as UserRole),
    enabled: Boolean(role),
    staleTime: 60_000,
  });
}
