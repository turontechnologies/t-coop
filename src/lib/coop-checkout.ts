import { openFlutterwaveCheckout } from "@/lib/flutterwave";
import { openPaystackCheckout } from "@/lib/paystack";

/** Which widget a co-op payment's public key belongs to — decided server-side at initialize
 * (the co-op's own gateway from Settings -> Integrations, else the platform's Paystack). */
export type CoopPaymentGateway = "Paystack" | "Flutterwave";

export interface CoopCheckoutOptions {
  gateway: CoopPaymentGateway;
  publicKey: string;
  email: string;
  amountNaira: number;
  reference: string;
  /** Flutterwave shows these in its modal; Paystack's inline widget has no equivalent. */
  title: string;
  description: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

/** Opens the checkout for a member's savings deposit or loan repayment, on whichever gateway the
 * backend's initialize call picked. */
export function openCoopCheckout({
  gateway,
  title,
  description,
  ...options
}: CoopCheckoutOptions): Promise<void> {
  if (gateway === "Flutterwave") {
    return openFlutterwaveCheckout({ ...options, title, description });
  }
  return openPaystackCheckout(options);
}
