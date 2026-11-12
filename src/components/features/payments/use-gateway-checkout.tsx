"use client";

import { useState } from "react";
import {
  CheckoutCancelled,
  CheckoutDialog,
} from "@/components/features/payments/checkout-dialog";
import { openCoopCheckout } from "@/lib/coop-checkout";
import type { PaystackChannel } from "@/lib/paystack";

/** What the backend's "initialize" step returns, whatever is being paid for. */
export interface GatewayIntent {
  reference: string;
  amount: number;
  gateway: "Paystack" | "Flutterwave" | "OPay" | string;
  publicKey?: string | null;
  /** OPay only: its checkout is a full-page redirect. */
  checkoutUrl?: string | null;
}

export interface GatewayCheckoutRequest {
  /** Who is being paid: the co-op's name, or "T-Coop" for the platform's own fees. */
  merchant: string;
  /** What for, e.g. "Savings deposit". */
  label: string;
  email: string;
  /** Shown before the payment starts; the initialized amount is what's charged. */
  amount: number;
  currency: string;
  initialize: () => Promise<GatewayIntent>;
  /** Verifies the payment server-side; throw to show it as failed. */
  confirm: (reference: string) => Promise<unknown>;
  /** After "Continue" on the success screen. */
  onComplete?: () => void;
  /** When the payer closes the window without paying. */
  onCancel?: () => void;
}

/**
 * One checkout for every payment in the app (savings, repayments, loan fees, subscriptions):
 * the same branded window, the gateway's own secure screen for the card or bank details, and a
 * server-side check before anything counts. Render `dialog` once and call `start(request)`.
 */
export function useGatewayCheckout() {
  const [request, setRequest] = useState<GatewayCheckoutRequest | null>(null);
  const [open, setOpen] = useState(false);

  const start = (next: GatewayCheckoutRequest) => {
    setRequest(next);
    setOpen(true);
  };

  const onPay = (channel: PaystackChannel, onVerifying: () => void) =>
    new Promise<string>((resolve, reject) => {
      if (!request) return reject(new Error("Nothing to pay for."));
      request
        .initialize()
        .then((intent) => {
          if (intent.gateway === "OPay") {
            if (!intent.checkoutUrl)
              throw new Error("OPay didn't return a checkout link.");
            // OPay is a full-page redirect; it brings the payer back to finish.
            window.location.assign(intent.checkoutUrl);
            return;
          }
          return openCoopCheckout({
            gateway:
              intent.gateway === "Flutterwave" ? "Flutterwave" : "Paystack",
            publicKey: intent.publicKey ?? "",
            email: request.email,
            amountNaira: intent.amount,
            reference: intent.reference,
            title: request.label,
            description: request.merchant,
            channels: [channel],
            onSuccess: async (reference) => {
              onVerifying();
              try {
                await request.confirm(reference);
                resolve(reference);
              } catch (error) {
                reject(error);
              }
            },
            onClose: () => reject(new CheckoutCancelled()),
          });
        })
        .catch(reject);
    });

  const dialog = request ? (
    <CheckoutDialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next);
        if (!next) request.onCancel?.();
      }}
      merchant={request.merchant}
      label={request.label}
      email={request.email}
      amount={request.amount}
      currency={request.currency}
      onPay={onPay}
      onDone={() => {
        setOpen(false);
        request.onComplete?.();
      }}
    />
  ) : null;

  return { start, dialog, isOpen: open };
}
