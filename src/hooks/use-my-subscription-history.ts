import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export function useMySubscriptionHistory() {
  return useQuery({
    queryKey: ["subscriptions", "me", "history"],
    queryFn: () => subscriptionService.getMyHistory(),
  });
}
