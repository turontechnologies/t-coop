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

/** Every role (admin, member, super admin) can call this for their own co-op — unlike
 * useCooperative, which 403s for a plain member. Used to show the co-op's name/logo on the
 * dashboard sidebar regardless of who's signed in. */
export function useCooperativeBranding(id: string | null | undefined) {
  return useQuery({
    queryKey: ["cooperatives", id, "branding"],
    queryFn: () => cooperativeService.getBranding(id as string),
    enabled: Boolean(id),
    staleTime: 60_000,
  });
}
