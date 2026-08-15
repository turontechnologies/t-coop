import { useMutation, useQueryClient } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";

export function useUpdateCooperativeStatus(id: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (status: "Active" | "Disabled") =>
      cooperativeService.updateCooperativeStatus(id, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      queryClient.invalidateQueries({ queryKey: ["cooperatives", id] });
    },
  });
}
