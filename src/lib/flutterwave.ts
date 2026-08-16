// Flutterwave's Inline checkout (v3), mirroring src/lib/paystack.ts's pattern exactly. Unlike
// Paystack (tested end to end against a real sandbox account this session), this has been
// implemented against Flutterwave's public API docs but not yet exercised against a real
// Flutterwave account — there were no test credentials available to verify with. It only ever
// activates when a super admin enables Flutterwave and enters real keys in Settings >
// Integrations; verify with a real Flutterwave sandbox transaction before relying on it in
// production.

interface FlutterwaveCheckoutOptions {
  public_key: string;
  tx_ref: string;
  amount: number;
  currency: string;
  customer: { email: string };
  customizations: { title: string; description: string; logo?: string };
  callback: (response: { status: string; tx_ref: string }) => void;
  onclose: () => void;
}

declare global {
  interface Window {
    FlutterwaveCheckout?: (options: FlutterwaveCheckoutOptions) => void;
  }
}

const FLUTTERWAVE_SCRIPT_SRC = "https://checkout.flutterwave.com/v3.js";

let scriptPromise: Promise<void> | null = null;

function loadFlutterwaveScript(): Promise<void> {
  if (window.FlutterwaveCheckout) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = FLUTTERWAVE_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Flutterwave."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export interface FlutterwaveCheckoutParams {
  publicKey: string;
  email: string;
  amountNaira: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export async function openFlutterwaveCheckout({
  publicKey,
  email,
  amountNaira,
  reference,
  onSuccess,
  onClose,
}: FlutterwaveCheckoutParams): Promise<void> {
  await loadFlutterwaveScript();
  if (!window.FlutterwaveCheckout) {
    throw new Error(
      "Couldn't load Flutterwave. Check your connection and try again.",
    );
  }

  window.FlutterwaveCheckout({
    public_key: publicKey,
    tx_ref: reference,
    amount: amountNaira,
    currency: "NGN",
    customer: { email },
    customizations: {
      title: "T-Cooperative Subscription",
      description: "Platform subscription renewal",
    },
    callback: (response) => {
      if (response.status === "successful") onSuccess(response.tx_ref);
    },
    onclose: onClose,
  });
}
