import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coopMemberService } from "@/services/coop-member.service";
import type { EditMemberFormValues } from "@/lib/validations/coop.schema";
import type { AddMemberFormValues } from "@/lib/validations/member-directory.schema";
import type { GuarantorPayload } from "@/lib/member-guarantors";

type Guarantors = { guarantors?: GuarantorPayload[] | null };

/** A member's recorded guarantors (Add/Edit Member). */
export function useMemberGuarantors(
  coopId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery({
    queryKey: ["coop-members", coopId, memberId, "guarantors"],
    queryFn: () =>
      coopMemberService.getMemberGuarantors(
        coopId as string,
        memberId as string,
      ),
    enabled: Boolean(coopId && memberId),
  });
}

export function useCoopMembers(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-members", coopId],
    queryFn: () => coopMemberService.getMembers(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useAddCoopMember(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: AddMemberFormValues & Guarantors) =>
      coopMemberService.addMember(coopId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["coop-members", coopId] });
    },
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
      values: EditMemberFormValues & Guarantors;
    }) => coopMemberService.updateMember(coopId, memberId, values),
    onSuccess: () => {
      // Also refreshes each member's guarantor list (same key prefix).
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
