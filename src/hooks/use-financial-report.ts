import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { reportService } from "@/services/report.service";

export function useFinancialReport(
  coopId: string | undefined,
  range: { from: string; to: string } | null,
) {
  return useQuery({
    queryKey: ["reports", coopId, "financial", range?.from, range?.to],
    queryFn: () =>
      reportService.getFinancialReport(
        coopId as string,
        range as { from: string; to: string },
      ),
    enabled: Boolean(coopId) && Boolean(range?.from) && Boolean(range?.to),
    placeholderData: keepPreviousData,
    staleTime: 60_000,
  });
}

export function useMemberStatement(
  coopId: string | undefined,
  memberId: string | null,
  range: { from: string; to: string },
) {
  return useQuery({
    queryKey: ["reports", coopId, "statement", memberId, range.from, range.to],
    queryFn: () =>
      reportService.getMemberStatement(
        coopId as string,
        memberId as string,
        range,
      ),
    enabled: Boolean(coopId) && Boolean(memberId),
    staleTime: 60_000,
  });
}
