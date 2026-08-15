import { useQuery } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";

export function useCooperative(id: string | undefined) {
  return useQuery({
    queryKey: ["cooperatives", id],
    queryFn: () => cooperativeService.getCooperative(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
  });
}
