import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coopMemberService } from "@/services/coop-member.service";
import type { EditMemberFormValues } from "@/lib/validations/coop.schema";

export function useCoopMembers(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-members", coopId],
    queryFn: () => coopMemberService.getMembers(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useUpdateCoopMember(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      values,
    }: {
      memberId: string;
      values: EditMemberFormValues;
    }) => coopMemberService.updateMember(coopId, memberId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coop-members", coopId] });
    },
  });
}

export function useUpdateCoopMemberStatus(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      memberId,
      status,
    }: {
      memberId: string;
      status: "Active" | "Inactive";
    }) => coopMemberService.updateMemberStatus(coopId, memberId, status),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coop-members", coopId] });
    },
  });
}
