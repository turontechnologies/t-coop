import { useQuery } from "@tanstack/react-query";
import { subscriptionPlanService } from "@/services/subscription-plan.service";

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: ["subscription-plans"],
    queryFn: () => subscriptionPlanService.getPlans(),
  });
}
