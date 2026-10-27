import { apiClient } from "@/lib/axios";
import type { SubscriptionPlan } from "@/types/subscription";
import type { SubscriptionPlanFormValues } from "@/lib/validations/subscription-plan.schema";

export const subscriptionPlanService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    const { data } = await apiClient.get<SubscriptionPlan[]>(
      "/settings/subscription-plans",
    );
    return data;
  },

  async createPlan(
    values: SubscriptionPlanFormValues,
  ): Promise<SubscriptionPlan> {
    const { data } = await apiClient.post<SubscriptionPlan>(
      "/settings/subscription-plans",
      {
        type: values.type,
        label: values.label,
        durationInDays: values.durationInDays,
        amount: values.amount,
      },
    );
    return data;
  },

  async updatePlan(
    id: string,
    values: Omit<SubscriptionPlanFormValues, "type">,
  ): Promise<SubscriptionPlan> {
    const { data } = await apiClient.patch<SubscriptionPlan>(
      `/settings/subscription-plans/${id}`,
      values,
    );
    return data;
  },

  async deletePlan(id: string): Promise<void> {
    await apiClient.delete(`/settings/subscription-plans/${id}`);
  },
};
