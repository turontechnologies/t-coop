import { useMutation, useQueryClient } from "@tanstack/react-query";
import { subscriptionPlanService } from "@/services/subscription-plan.service";
import type { SubscriptionPlanFormValues } from "@/lib/validations/subscription-plan.schema";

export function useSubscriptionPlanMutations() {
  const queryClient = useQueryClient();
  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: ["subscription-plans"] });

  const create = useMutation({
    mutationFn: (values: SubscriptionPlanFormValues) =>
      subscriptionPlanService.createPlan(values),
    onSuccess: invalidate,
  });

  const update = useMutation({
    mutationFn: ({
      id,
      values,
    }: {
      id: string;
      values: Omit<SubscriptionPlanFormValues, "type">;
    }) => subscriptionPlanService.updatePlan(id, values),
    onSuccess: invalidate,
  });

  const remove = useMutation({
    mutationFn: (id: string) => subscriptionPlanService.deletePlan(id),
    onSuccess: invalidate,
  });

  return { create, update, remove };
}
