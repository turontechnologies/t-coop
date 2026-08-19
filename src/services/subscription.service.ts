import { apiClient } from "@/lib/axios";
import { logActivity } from "@/lib/audit-log";
import {
  allCoopsSubscriptionRevenue,
  coopLastSubscriptionPaymentDate,
  coopSubscriptionRevenue,
  coopSubscriptionStatus,
  findCooperative,
} from "@/lib/coop-data";
import { useAuthStore } from "@/store/auth.store";
import { useCoopStore } from "@/store/coop.store";
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

const USE_MOCK = () =>
  process.env.NEXT_PUBLIC_USE_MOCK_SUBSCRIPTIONS === "true";

export const subscriptionService = {
  async getSubscriptions(): Promise<SubscriptionSummary[]> {
    if (USE_MOCK()) return mockGetSubscriptions();
    const { data } =
      await apiClient.get<SubscriptionSummary[]>("/subscriptions");
    return data;
  },

  async getSubscriptionsSummary(): Promise<{ mgtFeesReceived: number }> {
    if (USE_MOCK()) return mockGetSubscriptionsSummary();
    const { data } = await apiClient.get<{ mgtFeesReceived: number }>(
      "/subscriptions/summary",
    );
    return data;
  },

  async getSubscriptionHistory(coopId: string): Promise<SubscriptionPayment[]> {
    if (USE_MOCK()) return mockGetSubscriptionHistory(coopId);
    const { data } = await apiClient.get<SubscriptionPayment[]>(
      `/cooperatives/${coopId}/subscriptions`,
    );
    return data;
  },

  async recordSubscriptionPayment(
    coopId: string,
    payload: RecordSubscriptionPaymentPayload,
  ): Promise<RecordSubscriptionPaymentResult> {
    if (USE_MOCK()) return mockRecordSubscriptionPayment(coopId, payload);
    const { data } = await apiClient.post<RecordSubscriptionPaymentResult>(
      `/cooperatives/${coopId}/subscriptions`,
      payload,
    );
    return data;
  },

  // --- Self-service (the signed-in admin, for their own co-op) ---

  async getMySubscription(): Promise<MySubscription> {
    if (USE_MOCK()) return mockGetMySubscription();
    const { data } = await apiClient.get<MySubscription>("/subscriptions/me");
    return data;
  },

  async getMyHistory(): Promise<SubscriptionPayment[]> {
    if (USE_MOCK()) return mockGetMyHistory();
    const { data } = await apiClient.get<SubscriptionPayment[]>(
      "/subscriptions/me/history",
    );
    return data;
  },

  async initializePayment(
    planId: string,
    gateway: PaymentGateway,
  ): Promise<InitializePaymentResult> {
    if (USE_MOCK()) return mockInitializePayment(planId, gateway);
    const { data } = await apiClient.post<InitializePaymentResult>(
      "/subscriptions/me/initialize",
      { planId, gateway },
    );
    return data;
  },

  async confirmPayment(reference: string): Promise<SubscriptionReceipt> {
    if (USE_MOCK()) return mockConfirmPayment(reference);
    const { data } = await apiClient.post<SubscriptionReceipt>(
      "/subscriptions/me/confirm",
      {
        reference,
      },
    );
    return data;
  },
};

// Kept for local demoing without a backend running at all — flip
// NEXT_PUBLIC_USE_MOCK_SUBSCRIPTIONS back to "true" to use these instead.
// The mock co-op store never modeled a billing cycle/expiry date, so this
// fallback keeps computing status from the latest payment's own `status`
// field rather than real date math — an approximation, not a regression,
// since the mock was never wired to the enforcement filter either.
async function mockGetSubscriptions(): Promise<SubscriptionSummary[]> {
  await new Promise((resolve) => setTimeout(resolve, 500));
  return useCoopStore.getState().cooperatives.map((coop) => ({
    coopId: coop.id,
    coopName: coop.name,
    revenueEarned: coopSubscriptionRevenue(coop),
    subscriptionFee: coop.subscriptionFee,
    subscriptionCycle: null,
    lastPaymentDate: coopLastSubscriptionPaymentDate(coop) ?? null,
    subscriptionExpiresAt: null,
    status: coopSubscriptionStatus(coop),
  }));
}

async function mockGetSubscriptionsSummary(): Promise<{
  mgtFeesReceived: number;
}> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  return {
    mgtFeesReceived: allCoopsSubscriptionRevenue(
      useCoopStore.getState().cooperatives,
    ),
  };
}

async function mockGetSubscriptionHistory(
  coopId: string,
): Promise<SubscriptionPayment[]> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = findCooperative(useCoopStore.getState().cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");
  return coop.subscriptionPayments.map((payment) => ({
    id: payment.id,
    paymentRef: payment.paymentRef,
    amountPaid: payment.amountPaid,
    method: payment.method,
    date: payment.date,
    type:
      coop.subscriptionPayments.at(-1) === payment
        ? "New Subscription"
        : "Renewal",
    cycle: "Yearly",
    status: payment.status,
    resultingExpiresAt: null,
  }));
}

async function mockRecordSubscriptionPayment(
  coopId: string,
  payload: RecordSubscriptionPaymentPayload,
): Promise<RecordSubscriptionPaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 700));
  const store = useCoopStore.getState();
  const coop = findCooperative(store.cooperatives, coopId);
  if (!coop) throw new Error("We couldn't find that co-operative");

  const type =
    coop.subscriptionPayments.length === 0 ? "New Subscription" : "Renewal";
  const today = new Date().toISOString().slice(0, 10);
  const payment = {
    id: `coop-sub-${Date.now()}`,
    paymentRef: `${Date.now()}`,
    amountPaid: payload.amountPaid,
    method: "Manual" as const,
    date: today,
    narration: type,
    status: "Active" as const,
  };
  store.addSubscriptionPayment(coopId, payment);
  logActivity({
    module: "Subscriptions",
    action: "Create",
    resource: coop.name,
  });

  // Mock mode has no real plan catalog behind it (see mockPlanLookup) — always treats the
  // manual/self-service payload as a Yearly plan, which is the only case the offline demo
  // needs to support.
  const nextRenewalDate = addDays(today, 365);
  return {
    payment: {
      id: payment.id,
      paymentRef: payment.paymentRef,
      amountPaid: payment.amountPaid,
      method: payment.method,
      date: payment.date,
      type,
      cycle: "Yearly",
      status: payment.status,
      resultingExpiresAt: nextRenewalDate,
    },
    nextRenewalDate,
  };
}

// The mock co-op store has no concept of "which co-op does the signed-in admin belong to"
// (mock users and mock co-ops are two unrelated seed datasets) — so self-service mock mode
// just operates on the first co-op in the store as a stand-in. Fine for offline demoing; the
// real backend (the actual point of this feature) properly scopes to the caller's own co-op.
function mockMyCoop() {
  const coop = useCoopStore.getState().cooperatives[0];
  if (!coop) throw new Error("No co-operative available in mock data");
  return coop;
}

// A tiny stand-in for the real Subscription Plans catalog (see subscription-plan.service.ts) —
// offline demo mode doesn't share state with that service, so it needs its own fixed options.
const MOCK_PLANS = [
  { id: "mock-plan-weekly", label: "Weekly", durationInDays: 7, divisor: 52 },
  {
    id: "mock-plan-monthly",
    label: "Monthly",
    durationInDays: 30,
    divisor: 12,
  },
  {
    id: "mock-plan-quarterly",
    label: "Quarterly",
    durationInDays: 90,
    divisor: 4,
  },
  { id: "mock-plan-yearly", label: "Yearly", durationInDays: 365, divisor: 1 },
] as const;

async function mockGetMySubscription(): Promise<MySubscription> {
  await new Promise((resolve) => setTimeout(resolve, 400));
  const coop = mockMyCoop();
  const yearly = coop.subscriptionFee;
  return {
    coopId: coop.id,
    coopName: coop.name,
    adminName: useAuthStore.getState().member?.name ?? coop.adminName,
    status: coopSubscriptionStatus(coop),
    subscriptionCycle: "Yearly",
    subscriptionExpiresAt: null,
    availablePlans: MOCK_PLANS.map((plan) => ({
      id: plan.id,
      type:
        coopSubscriptionStatus(coop) === "Active"
          ? "Renewal"
          : "New Subscription",
      label: plan.label,
      durationInDays: plan.durationInDays,
      amount: Math.round((yearly / plan.divisor) * 100) / 100,
      status: "Active",
    })),
    availableGateways: [
      {
        gateway: "Paystack",
        publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
      },
    ],
  };
}

async function mockGetMyHistory(): Promise<SubscriptionPayment[]> {
  return mockGetSubscriptionHistory(mockMyCoop().id);
}

async function mockInitializePayment(
  planId: string,
  gateway: PaymentGateway,
): Promise<InitializePaymentResult> {
  await new Promise((resolve) => setTimeout(resolve, 300));
  const coop = mockMyCoop();
  const plan =
    MOCK_PLANS.find((option) => option.id === planId) ?? MOCK_PLANS[3];
  const amount = Math.round((coop.subscriptionFee / plan.divisor) * 100) / 100;
  return {
    reference: `MOCK-SUB-${Date.now()}`,
    amount,
    gateway,
    publicKey: process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY ?? "",
    checkoutUrl: null,
  };
}

async function mockConfirmPayment(
  reference: string,
): Promise<SubscriptionReceipt> {
  const coop = mockMyCoop();
  const result = await mockRecordSubscriptionPayment(coop.id, {
    amountPaid: coop.subscriptionFee,
    planId: "mock-plan-yearly",
  });
  return {
    coopId: coop.id,
    coopName: coop.name,
    adminName: useAuthStore.getState().member?.name ?? coop.adminName,
    paymentRef: reference,
    amountPaid: result.payment.amountPaid,
    method: result.payment.method,
    date: result.payment.date,
    type: result.payment.type,
    cycle: result.payment.cycle,
    status: result.payment.status,
    nextRenewalDate: result.nextRenewalDate,
  };
}

function addDays(isoDate: string, days: number): string {
  const date = new Date(isoDate);
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}
