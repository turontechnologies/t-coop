import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  loanSelfService,
  type DisbursePayload,
  type LoanApplicationPayload,
  type LoanSettingsPayload,
  type OfferResponsePayload,
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

/** A committee member's decision on the loan's current step. Approving carries their suggested
 * amount and repayment period. */
export function useLoanDecision(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      decision,
      ...options
    }: {
      loanId: string;
      decision: "Approved" | "Rejected";
      rejectionReason?: string;
      suggestedAmount?: number;
      suggestedMonths?: number;
      note?: string;
    }) => loanSelfService.decide(coopId, loanId, decision, options),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}

export function useRespondToLoanOffer(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      ...payload
    }: OfferResponsePayload & { loanId: string }) =>
      loanSelfService.respondToOffer(coopId, loanId, payload),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}

export function useDisburseLoan(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      loanId,
      ...payload
    }: DisbursePayload & { loanId: string }) =>
      loanSelfService.disburse(coopId, loanId, payload),
    onSuccess: () => invalidateLoans(queryClient, coopId),
  });
}

/** Loans waiting on the signed-in member as a committee member. */
export function useLoansAwaitingMe(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-loans", coopId, "awaiting-me"],
    queryFn: () => loanSelfService.awaitingMe(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 15_000,
  });
}

export function useLoanSettings(coopId: string | undefined) {
  return useQuery({
    queryKey: ["loan-settings", coopId],
    queryFn: () => loanSelfService.getSettings(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 60_000,
  });
}

export function useUpdateLoanSettings(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: LoanSettingsPayload) =>
      loanSelfService.updateSettings(coopId, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["loan-settings", coopId], data);
      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      invalidateLoans(queryClient, coopId);
    },
  });
}
