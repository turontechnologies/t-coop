import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { loanRepaymentService } from "@/services/loan-repayment.service";

function invalidateLoan(
  queryClient: ReturnType<typeof useQueryClient>,
  coopId: string,
  loanId: string,
) {
  queryClient.invalidateQueries({
    queryKey: ["loan-repayments", coopId, loanId],
  });
  queryClient.invalidateQueries({ queryKey: ["coop-loans", "record", loanId] });
  queryClient.invalidateQueries({ queryKey: ["coop-loans", coopId] });
}

export function useNextInstallment(
  coopId: string | undefined,
  loanId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["loan-repayments", coopId, loanId, "next"],
    queryFn: () =>
      loanRepaymentService.getNextInstallment(
        coopId as string,
        loanId as string,
      ),
    enabled: Boolean(coopId) && Boolean(loanId) && enabled,
    staleTime: 0,
    retry: false,
  });
}

export function useLoanRepayments(
  coopId: string | undefined,
  loanId: string | undefined,
) {
  return useQuery({
    queryKey: ["loan-repayments", coopId, loanId],
    queryFn: () =>
      loanRepaymentService.list(coopId as string, loanId as string),
    enabled: Boolean(coopId) && Boolean(loanId),
    staleTime: 15_000,
  });
}

export function useInitializeRepayment(coopId: string, loanId: string) {
  return useMutation({
    mutationFn: () => loanRepaymentService.initialize(coopId, loanId),
  });
}

export function useConfirmRepayment(coopId: string, loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (reference: string) =>
      loanRepaymentService.confirm(coopId, loanId, reference),
    onSuccess: () => invalidateLoan(queryClient, coopId, loanId),
  });
}

export function useManualRepayment(coopId: string, loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => loanRepaymentService.manual(coopId, loanId),
    onSuccess: () => invalidateLoan(queryClient, coopId, loanId),
  });
}
