export type SubscriptionStatus = "Active" | "Overdue";

export type SubscriptionPlanType = "New Subscription" | "Renewal";

/** A super-admin-managed subscription price — Payment Settings > Subscription Plans. Freely
 * addable/editable/deletable, so `label`/`durationInDays` are never a fixed enum. */
export interface SubscriptionPlan {
  id: string;
  type: SubscriptionPlanType;
  label: string;
  durationInDays: number;
  amount: number;
  status: "Active" | "Inactive";
}

/** One row of a co-op's payment history — matches SubscriptionPaymentDto. `cycle` is whatever
 * label the plan used at the time had; it's a snapshot, not a live reference to the plan. */
export interface SubscriptionPayment {
  id: string;
  paymentRef: string;
  amountPaid: number;
  method: "Manual" | "Paystack" | "Flutterwave";
  date: string;
  /** "New Subscription" for a co-op's first ever payment, "Renewal" for every one after — set server-side. */
  type: SubscriptionPlanType;
  cycle: string;
  status: SubscriptionStatus;
  resultingExpiresAt: string | null;
}

/** One row of the super admin's platform-wide subscriptions table — matches SubscriptionSummaryDto. */
export interface SubscriptionSummary {
  coopId: string;
  coopName: string;
  revenueEarned: number;
  subscriptionFee: number;
  subscriptionCycle: string | null;
  lastPaymentDate: string | null;
  subscriptionExpiresAt: string | null;
  status: SubscriptionStatus;
}

export interface RecordSubscriptionPaymentPayload {
  amountPaid: number;
  planId: string;
}

export interface RecordSubscriptionPaymentResult {
  payment: SubscriptionPayment;
  nextRenewalDate: string;
}

export type PaymentGateway = "Paystack" | "Flutterwave";

/** GET /subscriptions/me — the signed-in admin's own co-op. */
export interface MySubscription {
  coopId: string;
  coopName: string;
  adminName: string;
  status: SubscriptionStatus;
  subscriptionCycle: string | null;
  subscriptionExpiresAt: string | null;
  availablePlans: SubscriptionPlan[];
  availableGateways: { gateway: PaymentGateway; publicKey: string }[];
}

export interface InitializePaymentResult {
  reference: string;
  amount: number;
  gateway: PaymentGateway;
  publicKey: string;
}

/** Everything a receipt (on-screen or downloaded) needs. */
export interface SubscriptionReceipt {
  coopId: string;
  coopName: string;
  adminName: string;
  paymentRef: string;
  amountPaid: number;
  method: string;
  date: string;
  type: SubscriptionPlanType;
  cycle: string;
  status: SubscriptionStatus;
  nextRenewalDate: string;
}
