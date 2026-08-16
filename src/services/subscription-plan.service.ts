import { apiClient } from "@/lib/axios";
import { logActivity } from "@/lib/audit-log";
import type { SubscriptionPlan } from "@/types/subscription";
import type { SubscriptionPlanFormValues } from "@/lib/validations/subscription-plan.schema";

const USE_MOCK = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_SUBSCRIPTIONS === "true";

// Local, in-memory only — subscription plans are a super-admin catalog with no natural home in
// the existing mock co-op store, and this feature has always been built real-backend-first (see
// subscription.service.ts). Good enough for offline demoing without a backend running at all;
// resets on reload.
let mockPlans: SubscriptionPlan[] = [
  {
    id: "mock-1",
    type: "New Subscription",
    label: "Weekly",
    durationInDays: 7,
    amount: 2885,
    status: "Active",
  },
  {
    id: "mock-2",
    type: "New Subscription",
    label: "Monthly",
    durationInDays: 30,
    amount: 12500,
    status: "Active",
  },
  {
    id: "mock-3",
    type: "New Subscription",
    label: "Quarterly",
    durationInDays: 90,
    amount: 37500,
    status: "Active",
  },
  {
    id: "mock-4",
    type: "New Subscription",
    label: "Yearly",
    durationInDays: 365,
    amount: 150000,
    status: "Active",
  },
  {
    id: "mock-5",
    type: "Renewal",
    label: "Weekly",
    durationInDays: 7,
    amount: 2885,
    status: "Active",
  },
  {
    id: "mock-6",
    type: "Renewal",
    label: "Monthly",
    durationInDays: 30,
    amount: 12500,
    status: "Active",
  },
  {
    id: "mock-7",
    type: "Renewal",
    label: "Quarterly",
    durationInDays: 90,
    amount: 37500,
    status: "Active",
  },
  {
    id: "mock-8",
    type: "Renewal",
    label: "Yearly",
    durationInDays: 365,
    amount: 150000,
    status: "Active",
  },
];

export const subscriptionPlanService = {
  async getPlans(): Promise<SubscriptionPlan[]> {
    if (USE_MOCK()) return mockGetPlans();
    const { data } = await apiClient.get<SubscriptionPlan[]>(
      "/settings/subscription-plans",
    );
    return data;
  },

  async createPlan(
    values: SubscriptionPlanFormValues,
  ): Promise<SubscriptionPlan> {
    if (USE_MOCK()) return mockCreatePlan(values);
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
    if (USE_MOCK()) return mockUpdatePlan(id, values);
    const { data } = await apiClient.patch<SubscriptionPlan>(
      `/settings/subscription-plans/${id}`,
      values,
    );
    return data;
  },

  async deletePlan(id: string): Promise<void> {
    if (USE_MOCK()) return mockDeletePlan(id);
    await apiClient.delete(`/settings/subscription-plans/${id}`);
  },
};

async function mockGetPlans(): Promise<SubscriptionPlan[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  return mockPlans;
}

async function mockCreatePlan(
  values: SubscriptionPlanFormValues,
): Promise<SubscriptionPlan> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const plan: SubscriptionPlan = { id: `mock-${Date.now()}`, ...values };
  mockPlans = [...mockPlans, plan];
  logActivity({ module: "Settings", action: "Create", resource: plan.label });
  return plan;
}

async function mockUpdatePlan(
  id: string,
  values: Omit<SubscriptionPlanFormValues, "type">,
): Promise<SubscriptionPlan> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  const existing = mockPlans.find((plan) => plan.id === id);
  if (!existing) throw new Error("We couldn't find that plan");
  const updated: SubscriptionPlan = { ...existing, ...values };
  mockPlans = mockPlans.map((plan) => (plan.id === id ? updated : plan));
  logActivity({
    module: "Settings",
    action: "Update",
    resource: updated.label,
  });
  return updated;
}

async function mockDeletePlan(id: string): Promise<void> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const existing = mockPlans.find((plan) => plan.id === id);
  mockPlans = mockPlans.filter((plan) => plan.id !== id);
  if (existing) {
    logActivity({
      module: "Settings",
      action: "Delete",
      resource: existing.label,
      status: "Warning",
    });
  }
}
