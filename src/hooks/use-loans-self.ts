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
  queryClient.invalidateQueries({ queryKey: ["coop-loans", "record"] });
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

/** A member's full borrowing record — co-op staff, or the member themselves. */
export function useLoanHistory(
  coopId: string | undefined,
  memberId: string | undefined,
) {
  return useQuery({
    queryKey: ["coop-loans", coopId, "history", memberId],
    queryFn: () =>
      loanSelfService.getLoanHistory(coopId as string, memberId as string),
    enabled: Boolean(coopId) && Boolean(memberId),
    staleTime: 30_000,
    retry: false,
  });
}

export function useLoanApprovals(
  coopId: string | undefined,
  loanId: string | undefined,
) {
  return useQuery({
    queryKey: ["coop-loans", coopId, "approvals", loanId],
    queryFn: () =>
      loanSelfService.getApprovals(coopId as string, loanId as string),
    enabled: Boolean(coopId) && Boolean(loanId),
    staleTime: 0,
  });
}

/** An officer's decision on the loan's current step — approving at Secretary pays it out
 * server-side. */
export function useLoanDecision(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      decision,
      rejectionReason,
    }: {
      loanId: string;
      decision: "Approved" | "Rejected";
      rejectionReason?: string;
    }) => loanSelfService.decide(coopId, loanId, decision, { rejectionReason }),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}
