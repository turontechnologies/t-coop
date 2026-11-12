"use client";

import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import {
  Check,
  CreditCard,
  Hash,
  Landmark,
  Loader2,
  RefreshCw,
  ShieldCheck,
  X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import type { PaystackChannel } from "@/lib/paystack";
import { formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";

const EASE = [0.16, 1, 0.3, 1] as const;

export type CheckoutMethod = "card" | "bank" | "transfer" | "ussd";

const METHODS: {
  value: CheckoutMethod;
  label: string;
  icon: typeof CreditCard;
  channel: PaystackChannel;
  lede: string;
  detail: string;
}[] = [
  {
    value: "card",
    label: "Card",
    icon: CreditCard,
    channel: "card",
    lede: "Pay with your debit card",
    detail:
      "Verve, Visa or Mastercard. You'll enter your card details in Paystack's secure window, and may be asked for your PIN or an OTP from your bank.",
  },
  {
    value: "bank",
    label: "Bank",
    icon: Landmark,
    channel: "bank",
    lede: "Pay from your bank account",
    detail:
      "Choose your bank and log in to authorise the payment, all inside Paystack's secure window.",
  },
  {
    value: "transfer",
    label: "Transfer",
    icon: RefreshCw,
    channel: "bank_transfer",
    lede: "Pay by bank transfer",
    detail:
      "You'll get a one-time account number to send the exact amount to. It confirms automatically once the money lands.",
  },
  {
    value: "ussd",
    label: "USSD",
    icon: Hash,
    channel: "ussd",
    lede: "Dial a code from your phone",
    detail:
      "Pick your bank to get a USSD code, dial it on the phone linked to your account, and follow the prompts.",
  },
];

/** Thrown by `onPay` when the payer closed the gateway's window without paying. */
export class CheckoutCancelled extends Error {
  constructor() {
    super("Payment cancelled");
  }
}

type Phase = "choose" | "gateway" | "verifying" | "success" | "failed";

/**
 * A branded checkout: the payer picks how to pay, then the gateway's own secure window (Paystack,
 * or Flutterwave) takes the card or bank details — they never touch this app — and the payment is
 * verified on our server before it counts.
 */
export function CheckoutDialog({
  open,
  onOpenChange,
  merchant,
  label,
  email,
  amount,
  currency,
  onPay,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  merchant: string;
  label: string;
  email: string;
  amount: number;
  currency: string;
  /** Opens the gateway for this channel, resolves with the verified reference. Calls
   * `onVerifying` once the gateway reports success and the server check starts. Rejects with
   * {@link CheckoutCancelled} when the payer closes the gateway without paying. */
  onPay: (channel: PaystackChannel, onVerifying: () => void) => Promise<string>;
  /** "Continue" after a successful payment. */
  onDone: () => void;
}) {
  const [method, setMethod] = useState<CheckoutMethod>("card");
  const [phase, setPhase] = useState<Phase>("choose");
  const [reference, setReference] = useState<string | null>(null);
  const [failure, setFailure] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setPhase("choose");
      setReference(null);
      setFailure(null);
    }
  }, [open]);

  const current = METHODS.find((m) => m.value === method) ?? METHODS[0];
  const price = formatMoney(amount, currency);
  const locked = phase !== "choose";

  const pay = async () => {
    setFailure(null);
    setPhase("gateway");
    try {
      const ref = await onPay(current.channel, () => setPhase("verifying"));
      setReference(ref);
      setPhase("success");
    } catch (error) {
      if (error instanceof CheckoutCancelled) {
        setPhase("choose");
        return;
      }
      setFailure(
        error instanceof Error
          ? error.message
          : "Your payment didn't go through.",
      );
      setPhase("failed");
    }
  };

  return (
    <Dialog
      // Step aside while the gateway's own window is open, so the two don't fight over focus.
      open={open && phase !== "gateway"}
      onOpenChange={(next) => {
        if (phase === "verifying") return;
        if (!next && phase === "success") onDone();
        else onOpenChange(next);
      }}
    >
      <DialogContent
        showClose={false}
        className="gap-0 overflow-hidden p-0 sm:max-w-[720px] sm:p-0"
      >
        <DialogTitle className="sr-only">{label}</DialogTitle>
        <div className="grid max-h-[92dvh] grid-cols-1 sm:min-h-[460px] sm:grid-cols-[200px_minmax(0,1fr)]">
          {/* Methods rail */}
          <aside className="flex overflow-x-auto border-b border-border bg-muted/50 sm:flex-col sm:overflow-visible sm:border-r sm:border-b-0 sm:py-5">
            <p className="hidden px-5 pb-3.5 text-xs font-bold tracking-wider text-muted-foreground uppercase sm:block">
              Pay with
            </p>
            {METHODS.map((m) => {
              const active = m.value === method;
              return (
                <button
                  key={m.value}
                  type="button"
                  aria-pressed={active}
                  disabled={locked}
                  onClick={() => setMethod(m.value)}
                  className={cn(
                    "relative flex shrink-0 items-center gap-3 px-4 py-3.5 text-left text-sm font-semibold whitespace-nowrap transition-colors sm:w-full sm:border-t sm:border-border sm:px-5 sm:py-4 sm:last:border-b",
                    active
                      ? "bg-card text-primary dark:text-emerald-300"
                      : "text-muted-foreground enabled:hover:bg-muted enabled:hover:text-foreground",
                    locked && "cursor-default opacity-60",
                  )}
                >
                  <m.icon className="size-4" aria-hidden="true" />
                  {m.label}
                  {active ? (
                    <motion.span
                      layoutId="checkout-method"
                      className="absolute inset-x-0 bottom-0 h-[3px] bg-emerald-500 sm:inset-y-0 sm:right-[-1px] sm:left-auto sm:h-auto sm:w-[3px]"
                      transition={{ duration: 0.25, ease: EASE }}
                    />
                  ) : null}
                </button>
              );
            })}
          </aside>

          {/* Main */}
          <section className="flex min-w-0 flex-col overflow-y-auto">
            <header className="flex items-start gap-3 border-b border-border px-6 pt-5 pb-4">
              <div className="grid min-w-0 flex-1">
                <span className="font-bold text-foreground">{merchant}</span>
                <span className="text-sm text-muted-foreground">{label}</span>
              </div>
              <div className="grid max-w-[45%] text-right text-sm text-muted-foreground">
                <span className="hidden truncate sm:block" title={email}>
                  {email}
                </span>
                <span>
                  Pay{" "}
                  <b className="text-base text-emerald-600 dark:text-emerald-400">
                    {price}
                  </b>
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="-mt-1.5 -mr-2.5"
                aria-label="Cancel payment"
                disabled={phase === "verifying"}
                onClick={() =>
                  phase === "success" ? onDone() : onOpenChange(false)
                }
              >
                <X className="size-4" aria-hidden="true" />
              </Button>
            </header>

            <div className="grid flex-1 content-center gap-4 px-6 py-6">
              <AnimatePresence mode="wait" initial={false}>
                {phase === "choose" || phase === "gateway" ? (
                  <motion.div
                    key={`choose-${method}`}
                    initial={{ opacity: 0, y: 6 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -6 }}
                    transition={{ duration: 0.2, ease: EASE }}
                    className="grid gap-4"
                  >
                    <div className="mx-auto flex size-14 items-center justify-center rounded-full bg-primary/10 text-primary dark:text-emerald-300">
                      <current.icon className="size-6" aria-hidden="true" />
                    </div>
                    <p className="text-center text-base font-semibold text-foreground">
                      {current.lede}
                    </p>
                    <p className="mx-auto max-w-sm text-center text-sm text-muted-foreground">
                      {current.detail}
                    </p>
                    <Button
                      size="lg"
                      className="w-full bg-emerald-600 text-white hover:bg-emerald-700"
                      onClick={pay}
                      disabled={phase === "gateway"}
                    >
                      {phase === "gateway" ? (
                        <Loader2
                          className="size-4 animate-spin"
                          aria-hidden="true"
                        />
                      ) : null}
                      Pay {price}
                    </Button>
                  </motion.div>
                ) : phase === "verifying" ? (
                  <State key="verifying">
                    <span className="size-11 animate-spin rounded-full border-[3px] border-border border-t-emerald-500" />
                    <b className="text-lg text-foreground">
                      Confirming your payment…
                    </b>
                    <p className="text-muted-foreground">
                      Don&apos;t close this window.
                    </p>
                  </State>
                ) : phase === "success" ? (
                  <State key="success">
                    <motion.span
                      initial={{ scale: 0.6, opacity: 0 }}
                      animate={{ scale: 1, opacity: 1 }}
                      transition={{
                        type: "spring",
                        stiffness: 420,
                        damping: 22,
                      }}
                      className="flex size-15 items-center justify-center rounded-full bg-emerald-100 text-emerald-700 dark:bg-emerald-500/15 dark:text-emerald-300"
                    >
                      <Check
                        className="size-7"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </motion.span>
                    <b className="text-lg text-foreground">
                      Payment successful
                    </b>
                    <p className="text-muted-foreground">
                      {price} paid for {label.toLowerCase()}.
                    </p>
                    {reference ? (
                      <p className="text-sm text-muted-foreground/80">
                        Reference: {reference}
                      </p>
                    ) : null}
                    <Button size="lg" className="mt-3 w-full" onClick={onDone}>
                      Continue
                    </Button>
                  </State>
                ) : (
                  <State key="failed">
                    <span className="flex size-15 items-center justify-center rounded-full bg-destructive/10 text-destructive">
                      <X
                        className="size-7"
                        strokeWidth={3}
                        aria-hidden="true"
                      />
                    </span>
                    <b className="text-lg text-foreground">
                      Payment didn&apos;t go through
                    </b>
                    <p className="text-muted-foreground">{failure}</p>
                    <Button
                      size="lg"
                      className="mt-3 w-full"
                      onClick={() => setPhase("choose")}
                    >
                      Try again
                    </Button>
                  </State>
                )}
              </AnimatePresence>
            </div>

            <footer className="flex items-center justify-center gap-1.5 border-t border-border px-6 py-3 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5" aria-hidden="true" />
              Secured by Paystack. Your card and bank details never touch
              T-Coop.
            </footer>
          </section>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function State({ children }: { children: React.ReactNode }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.2, ease: EASE }}
      className="grid justify-items-center gap-2 py-4 text-center"
    >
      {children}
    </motion.div>
  );
}
