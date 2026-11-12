import { useQuery, useQueryClient } from "@tanstack/react-query";
import { CheckoutCancelled } from "@/components/features/payments/checkout-dialog";
import { openCoopCheckout } from "@/lib/coop-checkout";
import type { PaystackChannel } from "@/lib/paystack";
import { loanFeeService } from "@/services/loan-fee.service";

const feeKey = (coopId: string | undefined) => ["loan-fee", coopId];

/** The co-op's loan application fee, and whether the member has paid one that's unused. */
export function useLoanFeeStatus(coopId: string | undefined, enabled = true) {
  return useQuery({
    queryKey: feeKey(coopId),
    queryFn: () => loanFeeService.status(coopId as string),
    enabled: Boolean(coopId) && enabled,
    staleTime: 0,
  });
}

/**
 * Pays the application fee: starts it server-side, opens the gateway's secure window on the
 * chosen channel, then has the server verify it. Resolves with the reference.
 */
export function useLoanFeePayment(coopId: string | undefined, email: string) {
  const queryClient = useQueryClient();
  return async (channel: PaystackChannel, onVerifying: () => void) => {
    if (!coopId) throw new Error("No co-operative selected.");
    const checkout = await loanFeeService.initialize(coopId);
    return new Promise<string>((resolve, reject) => {
      openCoopCheckout({
        gateway: checkout.gateway,
        publicKey: checkout.publicKey,
        email,
        amountNaira: checkout.amount,
        reference: checkout.reference,
        title: "Loan application fee",
        description: "Paid before you apply for a loan",
        channels: [channel],
        onSuccess: async (reference) => {
          onVerifying();
          try {
            await loanFeeService.confirm(coopId, reference);
            await queryClient.invalidateQueries({ queryKey: feeKey(coopId) });
            resolve(reference);
          } catch (error) {
            reject(error);
          }
        },
        onClose: () => reject(new CheckoutCancelled()),
      }).catch(reject);
    });
  };
}
