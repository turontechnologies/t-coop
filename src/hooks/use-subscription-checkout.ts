import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import type { PaymentGateway } from "@/types/subscription";

/** The two server round-trips either side of the actual gateway checkout — see the Support page
 * for how they sandwich openPaystackCheckout/openFlutterwaveCheckout. */
export function useSubscriptionCheckout() {
  const queryClient = useQueryClient();

  const initialize = useMutation({
    mutationFn: ({
      planId,
      gateway,
    }: {
      planId: string;
      gateway: PaymentGateway;
    }) => subscriptionService.initializePayment(planId, gateway),
  });

  const confirm = useMutation({
    mutationFn: (reference: string) =>
      subscriptionService.confirmPayment(reference),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });

  return { initialize, confirm };
}
