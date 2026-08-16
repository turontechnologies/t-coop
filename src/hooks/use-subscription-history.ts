import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export function useSubscriptionHistory(coopId: string) {
  return useQuery({
    queryKey: ["subscriptions", coopId, "history"],
    queryFn: () => subscriptionService.getSubscriptionHistory(coopId),
    enabled: !!coopId,
  });
}
