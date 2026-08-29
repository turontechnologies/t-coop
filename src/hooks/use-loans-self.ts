import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loanSelfService,
  type LoanApplicationPayload,
} from "@/services/loan-self.service";

function invalidateLoans(
  queryClient: ReturnType<typeof useQueryClient>,
  coopId: string,
) {
  queryClient.invalidateQueries({ queryKey: ["coop-loans", coopId] });
  queryClient.invalidateQueries({ queryKey: ["dashboard"] });
}

export function useApplyForLoan(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoanApplicationPayload) =>
      loanSelfService.apply(coopId, payload),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}

export function useGuarantorResponse(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      decision,
      documentUrl,
    }: {
      loanId: string;
      decision: "Accepted" | "Rejected";
      documentUrl?: string;
    }) =>
      loanSelfService.guarantorResponse(coopId, loanId, decision, documentUrl),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}

export function useLoanDisbursementPreview(
  coopId: string | undefined,
  loanId: string | undefined,
  enabled: boolean,
) {
  return useQuery({
    queryKey: ["loan-disbursement", coopId, loanId],
    queryFn: () =>
      loanSelfService.getDisbursementPreview(
        coopId as string,
        loanId as string,
      ),
    enabled: Boolean(coopId) && Boolean(loanId) && enabled,
    staleTime: 0,
  });
}

export function useLoanDecision(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      decision,
      rejectionReason,
      transferReference,
    }: {
      loanId: string;
      decision: "Approved" | "Rejected";
      rejectionReason?: string;
      transferReference?: string;
    }) =>
      loanSelfService.decide(coopId, loanId, decision, {
        rejectionReason,
        transferReference,
      }),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}
