export type BillingCycle = "Weekly" | "Monthly" | "Quarterly" | "Yearly";

export type SubscriptionStatus = "Active" | "Overdue";

/** One row of a co-op's payment history — matches SubscriptionPaymentDto. */
export interface SubscriptionPayment {
  id: string;
  paymentRef: string;
  amountPaid: number;
  method: "Manual" | "Paystack";
  date: string;
  /** "New Subscription" for a co-op's first ever payment, "Renewal" for every one after — set server-side. */
  type: "New Subscription" | "Renewal";
  cycle: BillingCycle;
  status: SubscriptionStatus;
  resultingExpiresAt: string | null;
}

/** One row of the super admin's platform-wide subscriptions table — matches SubscriptionSummaryDto. */
export interface SubscriptionSummary {
  coopId: string;
  coopName: string;
  revenueEarned: number;
  subscriptionFee: number;
  subscriptionCycle: BillingCycle | null;
  lastPaymentDate: string | null;
  subscriptionExpiresAt: string | null;
  status: SubscriptionStatus;
}

export interface RecordSubscriptionPaymentPayload {
  amountPaid: number;
  cycle: BillingCycle;
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
  subscriptionCycle: BillingCycle | null;
  subscriptionExpiresAt: string | null;
  yearlyFee: number;
  cyclePricing: Record<Lowercase<BillingCycle>, number>;
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
  type: SubscriptionPayment["type"];
  cycle: BillingCycle;
  status: SubscriptionStatus;
  nextRenewalDate: string;
}
