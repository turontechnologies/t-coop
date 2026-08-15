import { useQuery } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";

export function useCooperatives() {
  return useQuery({
    queryKey: ["cooperatives"],
    queryFn: () => cooperativeService.getCooperatives(),
    staleTime: 30_000,
  });
}
