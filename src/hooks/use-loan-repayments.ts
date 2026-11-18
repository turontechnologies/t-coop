import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loanRepaymentService,
  type BulkRepaymentRow,
  type TransferClaimPayload,
} from "@/services/loan-repayment.service";

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
  queryClient.invalidateQueries({ queryKey: ["transfer-claims", coopId] });
}

export function useNextInstallment(
  coopId: string | undefined,
  loanId: string | undefined,
  enabled: boolean,
  count = 1,
) {
  return useQuery({
    queryKey: ["loan-repayments", coopId, loanId, "next", count],
    queryFn: () =>
      loanRepaymentService.getNextInstallment(
        coopId as string,
        loanId as string,
        count,
      ),
    placeholderData: (previous) => previous,
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
    mutationFn: (proof: { receiptUrl: string; note?: string }) =>
      loanRepaymentService.manual(coopId, loanId, proof),
    onSuccess: () => invalidateLoan(queryClient, coopId, loanId),
  });
}

/** A loan's bank-transfer repayments (the borrower's own, or any for staff). */
export function useLoanTransferClaims(
  coopId: string | undefined,
  loanId: string | undefined,
) {
  return useQuery({
    queryKey: ["transfer-claims", coopId, "loan", loanId],
    queryFn: () =>
      loanRepaymentService.loanTransferClaims(
        coopId as string,
        loanId as string,
      ),
    enabled: Boolean(coopId) && Boolean(loanId),
    staleTime: 15_000,
  });
}

/** The co-op's queue of bank-transfer repayments to confirm. */
export function useCoopTransferClaims(
  coopId: string | undefined,
  enabled = true,
) {
  return useQuery({
    queryKey: ["transfer-claims", coopId, "all"],
    queryFn: () => loanRepaymentService.coopTransferClaims(coopId as string),
    enabled: Boolean(coopId) && enabled,
    staleTime: 15_000,
  });
}

export function useSubmitTransferClaim(coopId: string, loanId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: TransferClaimPayload) =>
      loanRepaymentService.submitTransferClaim(coopId, loanId, payload),
    onSuccess: () => invalidateLoan(queryClient, coopId, loanId),
  });
}

export function useDecideTransferClaim(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      claimId,
      decision,
      reason,
    }: {
      claimId: string;
      loanId: string;
      decision: "Confirmed" | "Rejected";
      reason?: string;
    }) =>
      loanRepaymentService.decideTransferClaim(
        coopId,
        claimId,
        decision,
        reason,
      ),
    onSuccess: (_claim, { loanId }) =>
      invalidateLoan(queryClient, coopId, loanId),
  });
}

export function useBulkRepayments(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      rows,
      dryRun,
    }: {
      rows: BulkRepaymentRow[];
      dryRun: boolean;
    }) => loanRepaymentService.bulk(coopId, rows, dryRun),
    onSuccess: (result) => {
      if (result.dryRun) return;
      queryClient.invalidateQueries({ queryKey: ["coop-loans"] });
      queryClient.invalidateQueries({ queryKey: ["loan-repayments", coopId] });
    },
  });
}
