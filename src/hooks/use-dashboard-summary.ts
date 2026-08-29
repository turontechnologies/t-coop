import { useQuery } from "@tanstack/react-query";
import { dashboardService } from "@/services/dashboard.service";
import type { UserRole } from "@/types/auth";

export function useDashboardSummary(
  role: UserRole | undefined,
  currency: string,
) {
  return useQuery({
    queryKey: ["dashboard-summary", role, currency],
    queryFn: () => dashboardService.getSummary(role as UserRole, currency),
    enabled: Boolean(role),
    staleTime: 60_000,
  });
}
