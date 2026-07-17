interface PaystackHandler {
  openIframe: () => void;
}

interface PaystackSetupOptions {
  key: string;
  email: string;
  amount: number;
  currency: string;
  ref: string;
  callback: (response: { reference: string }) => void;
  onClose: () => void;
}

declare global {
  interface Window {
    PaystackPop?: {
      setup: (options: PaystackSetupOptions) => PaystackHandler;
    };
  }
}

const PAYSTACK_SCRIPT_SRC = "https://js.paystack.co/v1/inline.js";

let scriptPromise: Promise<void> | null = null;

function loadPaystackScript(): Promise<void> {
  if (window.PaystackPop) return Promise.resolve();
  if (scriptPromise) return scriptPromise;

  scriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement("script");
    script.src = PAYSTACK_SCRIPT_SRC;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error("Couldn't load Paystack."));
    document.body.appendChild(script);
  });
  return scriptPromise;
}

export function isPaystackConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
}

export interface PaystackCheckoutOptions {
  email: string;
  amountNaira: number;
  reference: string;
  onSuccess: (reference: string) => void;
  onClose: () => void;
}

export async function openPaystackCheckout({
  email,
  amountNaira,
  reference,
  onSuccess,
  onClose,
}: PaystackCheckoutOptions): Promise<void> {
  const key = process.env.NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY;
  if (!key) {
    throw new Error(
      "Paystack isn't configured yet. Add NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY to .env.local.",
    );
  }

  await loadPaystackScript();
  if (!window.PaystackPop) {
    throw new Error(
      "Couldn't load Paystack. Check your connection and try again.",
    );
  }

  const handler = window.PaystackPop.setup({
    key,
    email,
    amount: Math.round(amountNaira * 100),
    currency: "NGN",
    ref: reference,
    callback: (response) => onSuccess(response.reference),
    onClose,
  });
  handler.openIframe();
}
