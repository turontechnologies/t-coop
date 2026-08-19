import { useQuery } from "@tanstack/react-query";
import {
  coopSavingsService,
  type CoopSavingsRecordFilters,
} from "@/services/coop-savings.service";

export function useCoopSavingsTypes(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-savings", coopId, "types"],
    queryFn: () => coopSavingsService.getSavingsTypes(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopSavingsRecords(
  coopId: string | undefined,
  filters: CoopSavingsRecordFilters = {},
) {
  return useQuery({
    queryKey: ["coop-savings", coopId, "records", filters],
    queryFn: () =>
      coopSavingsService.getSavingsRecords(coopId as string, filters),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopSavingsRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: ["coop-savings", "record", recordId],
    queryFn: () => coopSavingsService.getSavingsRecord(recordId as string),
    enabled: Boolean(recordId),
    staleTime: 30_000,
  });
}
