import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  savingsSelfService,
  type InitializeDepositPayload,
  type ManualDepositPayload,
  type WithdrawalRequestPayload,
} from "@/services/savings-self.service";

function invalidateSavings(
  queryClient: ReturnType<typeof useQueryClient>,
  coopId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["savings-self", coopId] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useInitializeSavingsDeposit(coopId: string) {
  return useMutation({
    mutationFn: (payload: InitializeDepositPayload) =>
      savingsSelfService.initializeDeposit(coopId, payload),
  });
}

export function useConfirmSavingsDeposit(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) =>
      savingsSelfService.confirmDeposit(coopId, reference),
    onSuccess: () => invalidateSavings(queryClient, coopId),
  });
}

export function useManualSavingsDeposit(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: ManualDepositPayload) =>
      savingsSelfService.manualDeposit(coopId, payload),
    onSuccess: () => invalidateSavings(queryClient, coopId),
  });
}

export function useRequestWithdrawal(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: WithdrawalRequestPayload) =>
      savingsSelfService.requestWithdrawal(coopId, payload),
    onSuccess: () => invalidateSavings(queryClient, coopId),
  });
}

export function useWithdrawalRequests(
  coopId: string | undefined,
  memberId?: string,
) {
  return useQuery({
    queryKey: ["savings-self", coopId, "withdrawals", memberId ?? "all"],
    queryFn: () =>
      savingsSelfService.listWithdrawals(coopId as string, memberId),
    enabled: Boolean(coopId),
    staleTime: 15_000,
  });
}

export function useDecideWithdrawal(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      requestId,
      status,
      transferReference,
    }: {
      requestId: string;
      status: "Approved" | "Declined";
      transferReference?: string;
    }) =>
      savingsSelfService.decideWithdrawal(
        coopId,
        requestId,
        status,
        transferReference,
      ),
    onSuccess: () => invalidateSavings(queryClient, coopId),
  });
}
