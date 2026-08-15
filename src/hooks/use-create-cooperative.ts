import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";
import type { AddCooperativeFormValues } from "@/lib/validations/coop.schema";

export function useCreateCooperative() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AddCooperativeFormValues) =>
      cooperativeService.createCooperative(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
    },
  });
}
