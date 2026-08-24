import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  coopSavingsService,
  type CoopSavingsRecordFilters,
} from "@/services/coop-savings.service";
import type { SavingsTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";

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

export function useCoopSavingsTypeMutations(coopId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["coop-savings", coopId, "types"],
    });

  const createType = useMutation({
    mutationFn: (values: SavingsTypeSettingFormValues) =>
      coopSavingsService.createSavingsType(coopId, values),
    onSuccess: invalidate,
  });

  const updateType = useMutation({
    mutationFn: ({
      typeId,
      values,
    }: {
      typeId: string;
      values: SavingsTypeSettingFormValues;
    }) => coopSavingsService.updateSavingsType(coopId, typeId, values),
    onSuccess: invalidate,
  });

  const updateTypeStatus = useMutation({
    mutationFn: ({
      typeId,
      status,
    }: {
      typeId: string;
      status: "Active" | "Inactive";
    }) => coopSavingsService.updateSavingsTypeStatus(coopId, typeId, status),
    onSuccess: invalidate,
  });

  return { createType, updateType, updateTypeStatus };
}
