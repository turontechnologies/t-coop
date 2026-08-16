import { useQuery } from "@tanstack/react-query";
import { subscriptionService } from "@/services/subscription.service";

export function useSubscriptions() {
  return useQuery({
    queryKey: ["subscriptions"],
    queryFn: () => subscriptionService.getSubscriptions(),
  });
}
