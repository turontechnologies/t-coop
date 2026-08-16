import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export function useSubscriptionsSummary() {
  return useQuery({
    queryKey: ["subscriptions", "summary"],
    queryFn: () => subscriptionService.getSubscriptionsSummary(),
  });
}
