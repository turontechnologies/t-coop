import { apiClient } from "@/lib/axios";
import type {
  InitializePaymentResult,
  MySubscription,
  PaymentGateway,
  RecordSubscriptionPaymentPayload,
  RecordSubscriptionPaymentResult,
  SubscriptionPayment,
  SubscriptionReceipt,
  SubscriptionSummary,
} from "@/types/subscription";

export const subscriptionService = {
  async getSubscriptions(): Promise<SubscriptionSummary[]> {
    const { data } =
      await apiClient.get<SubscriptionSummary[]>("/subscriptions");
    return data;
  },

  async getSubscriptionsSummary(): Promise<{ mgtFeesReceived: number }> {
    const { data } = await apiClient.get<{ mgtFeesReceived: number }>(
      "/subscriptions/summary",
    );
    return data;
  },

  async getSubscriptionHistory(coopId: string): Promise<SubscriptionPayment[]> {
    const { data } = await apiClient.get<SubscriptionPayment[]>(
      `/cooperatives/${coopId}/subscriptions`,
    );
    return data;
  },

  async recordSubscriptionPayment(
    coopId: string,
    payload: RecordSubscriptionPaymentPayload,
  ): Promise<RecordSubscriptionPaymentResult> {
    const { data } = await apiClient.post<RecordSubscriptionPaymentResult>(
      `/cooperatives/${coopId}/subscriptions`,
      payload,
    );
    return data;
  },

  // --- Self-service (the signed-in admin, for their own co-op) ---

  async getMySubscription(): Promise<MySubscription> {
    const { data } = await apiClient.get<MySubscription>("/subscriptions/me");
    return data;
  },

  async getMyHistory(): Promise<SubscriptionPayment[]> {
    const { data } = await apiClient.get<SubscriptionPayment[]>(
      "/subscriptions/me/history",
    );
    return data;
  },

  async initializePayment(
    planId: string,
    gateway: PaymentGateway,
  ): Promise<InitializePaymentResult> {
    const { data } = await apiClient.post<InitializePaymentResult>(
      "/subscriptions/me/initialize",
      { planId, gateway },
    );
    return data;
  },

  async confirmPayment(reference: string): Promise<SubscriptionReceipt> {
    const { data } = await apiClient.post<SubscriptionReceipt>(
      "/subscriptions/me/confirm",
      {
        reference,
      },
    );
    return data;
  },
};
