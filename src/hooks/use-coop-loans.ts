import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  coopLoanService,
  type CoopLoanRecordFilters,
} from "@/services/coop-loan.service";
import type { LoanTypeSettingFormValues } from "@/lib/validations/admin-settings.schema";
import { useAuthStore } from "@/store/auth.store";

export function useCoopLoanTypes(coopId: string | undefined, enabled = true) {
  const role = useAuthStore((state) => state.member?.role);

  return useQuery({
    queryKey: ["coop-loans", coopId, "types", role ?? "signed-out"],
    queryFn: () => coopLoanService.getLoanTypes(coopId as string),
    enabled: Boolean(coopId) && enabled,
    staleTime: 0,
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

export function useCoopLoanTypeMutations(coopId: string) {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({
      queryKey: ["coop-loans", coopId, "types"],
    });

  const createType = useMutation({
    mutationFn: (values: LoanTypeSettingFormValues) =>
      coopLoanService.createLoanType(coopId, values),
    onSuccess: invalidate,
  });

  const updateType = useMutation({
    mutationFn: ({
      typeId,
      values,
    }: {
      typeId: string;
      values: LoanTypeSettingFormValues;
    }) => coopLoanService.updateLoanType(coopId, typeId, values),
    onSuccess: invalidate,
  });

  const updateTypeStatus = useMutation({
    mutationFn: ({
      typeId,
      status,
    }: {
      typeId: string;
      status: "Active" | "Inactive";
    }) => coopLoanService.updateLoanTypeStatus(coopId, typeId, status),
    onSuccess: invalidate,
  });

  return { createType, updateType, updateTypeStatus };
}
