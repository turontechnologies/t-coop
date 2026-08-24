import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";
import type { EditCooperativeFormValues } from "@/lib/validations/coop.schema";
import type { CoopBankAccountFormValues } from "@/lib/validations/admin-settings.schema";

export function useUpdateCooperative(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: EditCooperativeFormValues) =>
      cooperativeService.updateCooperative(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["cooperatives", id] });
    },
  });
}

export function useUpdateCooperativeBankAccount(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CoopBankAccountFormValues) =>
      cooperativeService.updateBankAccount(id, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["cooperatives", id] });
    },
  });
}
