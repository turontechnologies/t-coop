import { useQuery } from "@tanstack/react-query";
import {
  coopLoanService,
  type CoopLoanRecordFilters,
} from "@/services/coop-loan.service";

export function useCoopLoanTypes(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-loans", coopId, "types"],
    queryFn: () => coopLoanService.getLoanTypes(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopLoanRecords(
  coopId: string | undefined,
  filters: CoopLoanRecordFilters = {},
) {
  return useQuery({
    queryKey: ["coop-loans", coopId, "records", filters],
    queryFn: () => coopLoanService.getLoanRecords(coopId as string, filters),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopLoanRecord(recordId: string | undefined) {
  return useQuery({
    queryKey: ["coop-loans", "record", recordId],
    queryFn: () => coopLoanService.getLoanRecord(recordId as string),
    enabled: Boolean(recordId),
    staleTime: 30_000,
  });
}
