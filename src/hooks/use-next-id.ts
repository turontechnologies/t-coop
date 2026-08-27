import { useQuery } from "@tanstack/react-query";
import { cooperativeService } from "@/services/cooperative.service";

/** The next auto-generated co-op id, per the super admin's own configured format — see
 * CoopIdFormatForm (Settings -> Payment Settings -> Fees & Charges). Refetched fresh every time
 * the Add Co-operative form mounts, since another super admin could create a co-op in between. */
export function useNextCoopId() {
  return useQuery({
    queryKey: ["cooperatives", "next-id"],
    queryFn: () => cooperativeService.getNextCoopId(),
    staleTime: 0,
  });
}

/** The next auto-generated member id, per this co-op's own configured format — see the "Member
 * ID Format" section of CooperativeDetailsForm. */
export function useNextMemberId(coopId: string | undefined) {
  return useQuery({
    queryKey: ["cooperatives", coopId, "members", "next-id"],
    queryFn: () => cooperativeService.getNextMemberId(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 0,
  });
}
