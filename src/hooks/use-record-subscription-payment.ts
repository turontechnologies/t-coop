import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";
import type { RecordSubscriptionPaymentPayload } from "@/types/subscription";

export function useRecordSubscriptionPayment(coopId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: RecordSubscriptionPaymentPayload) =>
      subscriptionService.recordSubscriptionPayment(coopId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      queryClient.invalidateQueries({
        queryKey: ["subscriptions", coopId, "history"],
      });
      queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
    },
  });
}
