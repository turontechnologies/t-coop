import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export function useMySubscription() {
  return useQuery({
    queryKey: ["subscriptions", "me"],
    queryFn: () => subscriptionService.getMySubscription(),
  });
}
