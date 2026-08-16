"use client";

import { useState } from "react";
import { CheckCircle2, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { SubscriptionReceiptCard } from "@/components/features/support/subscription-receipt-card";
import { SupportTransactionHistory } from "@/components/features/support/support-transaction-history";
import { useMySubscription } from "@/hooks/use-my-subscription";
import { useMySubscriptionHistory } from "@/hooks/use-my-subscription-history";
import { useSubscriptionCheckout } from "@/hooks/use-subscription-checkout";
import { openFlutterwaveCheckout } from "@/lib/flutterwave";
import { formatDateLong, formatNaira } from "@/lib/format";
import { openPaystackCheckout } from "@/lib/paystack";
import { cn } from "@/lib/utils";
import { useAuthStore } from "@/store/auth.store";
import type {
  BillingCycle,
  PaymentGateway,
  SubscriptionPayment,
  SubscriptionReceipt,
} from "@/types/subscription";

const CYCLES: BillingCycle[] = ["Weekly", "Monthly", "Quarterly", "Yearly"];
const CYCLE_KEY: Record<BillingCycle, keyof MySubscriptionCyclePricing> = {
  Weekly: "weekly",
  Monthly: "monthly",
  Quarterly: "quarterly",
  Yearly: "yearly",
};

type MySubscriptionCyclePricing = {
  weekly: number;
  monthly: number;
  quarterly: number;
  yearly: number;
};

export function AdminSupportView() {
  const subscriptionQuery = useMySubscription();
  const historyQuery = useMySubscriptionHistory();
  const { initialize, confirm } = useSubscriptionCheckout();
  const member = useAuthStore((state) => state.member);

  const [cycle, setCycle] = useState<BillingCycle>("Yearly");
  const [gateway, setGateway] = useState<PaymentGateway | null>(null);
  const [paying, setPaying] = useState(false);
  const [receipt, setReceipt] = useState<SubscriptionReceipt | null>(null);

  const subscription = subscriptionQuery.data;
  const activeGateway =
    gateway ?? subscription?.availableGateways[0]?.gateway ?? null;

  const handlePay = async () => {
    if (!subscription || !activeGateway || !member) return;
    setPaying(true);
    try {
      const init = await initialize.mutateAsync({
        cycle,
        gateway: activeGateway,
      });

      const onSuccess = async (reference: string) => {
        try {
          const result = await confirm.mutateAsync(reference);
          setReceipt(result);
          await Promise.all([
            subscriptionQuery.refetch(),
            historyQuery.refetch(),
          ]);
          toast.success("Payment confirmed", {
            description: `${formatNaira(result.amountPaid)} received — your subscription is active.`,
          });
        } catch (error) {
          toast.error("We received your payment but couldn't confirm it", {
            description:
              error instanceof Error
                ? error.message
                : "Please contact support — your money is safe with the gateway.",
          });
        } finally {
          setPaying(false);
        }
      };

      const onClose = () => setPaying(false);

      if (activeGateway === "Paystack") {
        await openPaystackCheckout({
          email: member.email,
          amountNaira: init.amount,
          reference: init.reference,
          publicKey: init.publicKey,
          onSuccess,
          onClose,
        });
      } else {
        await openFlutterwaveCheckout({
          publicKey: init.publicKey,
          email: member.email,
          amountNaira: init.amount,
          reference: init.reference,
          onSuccess,
          onClose,
        });
      }
    } catch (error) {
      setPaying(false);
      toast.error("Couldn't start checkout", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleViewHistoryReceipt = (payment: SubscriptionPayment) => {
    if (!subscription) return;
    setReceipt({
      coopId: subscription.coopId,
      coopName: subscription.coopName,
      adminName: subscription.adminName,
      paymentRef: payment.paymentRef,
      amountPaid: payment.amountPaid,
      method: payment.method,
      date: payment.date,
      type: payment.type,
      cycle: payment.cycle,
      status: payment.status,
      nextRenewalDate: payment.resultingExpiresAt ?? payment.date,
    });
  };

  return (
    <div className="space-y-6">
      <QueryBoundary
        isLoading={subscriptionQuery.isLoading}
        isError={subscriptionQuery.isError}
        error={subscriptionQuery.error}
        onRetry={() => subscriptionQuery.refetch()}
        isRetrying={subscriptionQuery.isFetching}
      >
        {subscription ? (
          <>
            <Card>
              <CardContent className="space-y-4">
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <h2 className="text-sm font-semibold text-foreground">
                      Your Subscription
                    </h2>
                    <p className="text-xs text-muted-foreground">
                      {subscription.coopName} ({subscription.coopId})
                    </p>
                  </div>
                  <Badge
                    variant={
                      subscription.status === "Active"
                        ? "secondary"
                        : "destructive"
                    }
                    className={cn(
                      subscription.status === "Active" &&
                        "bg-success/15 text-success",
                    )}
                  >
                    {subscription.status}
                  </Badge>
                </div>

                {subscription.status !== "Active" ? (
                  <div className="flex items-start gap-2 rounded-lg bg-destructive/10 px-3 py-2.5 text-sm text-destructive">
                    <TriangleAlert
                      className="mt-0.5 size-4 shrink-0"
                      aria-hidden="true"
                    />
                    <p>
                      Your co-operative can&apos;t use the platform until you
                      renew below — every other page is locked until this is
                      paid.
                    </p>
                  </div>
                ) : null}

                <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
                  <Field
                    label="Current Cycle"
                    value={subscription.subscriptionCycle ?? "—"}
                  />
                  <Field
                    label={
                      subscription.status === "Active"
                        ? "Renews On"
                        : "Expired On"
                    }
                    value={
                      subscription.subscriptionExpiresAt
                        ? formatDateLong(
                            new Date(subscription.subscriptionExpiresAt),
                          )
                        : "—"
                    }
                  />
                  <Field
                    label="Yearly Fee"
                    value={formatNaira(subscription.yearlyFee)}
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="space-y-5">
                <h2 className="text-sm font-semibold text-foreground">
                  {subscription.status === "Active"
                    ? "Renew Subscription"
                    : "Subscribe Now"}
                </h2>

                <div className="space-y-2">
                  <Label>Billing Cycle</Label>
                  <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
                    {CYCLES.map((option) => {
                      const price =
                        subscription.cyclePricing[CYCLE_KEY[option]];
                      const selected = cycle === option;
                      return (
                        <button
                          key={option}
                          type="button"
                          onClick={() => setCycle(option)}
                          className={cn(
                            "rounded-xl border px-3 py-3 text-left transition-colors",
                            selected
                              ? "border-primary bg-primary/5 ring-1 ring-primary"
                              : "border-border hover:bg-muted/50",
                          )}
                        >
                          <p className="text-sm font-semibold text-foreground">
                            {option}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatNaira(price)}
                          </p>
                        </button>
                      );
                    })}
                  </div>
                </div>

                {subscription.availableGateways.length === 0 ? (
                  <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                    No payment gateway is configured on the platform yet — ask
                    your super admin to enable Paystack or Flutterwave in
                    Settings before you can pay.
                  </p>
                ) : (
                  <div className="space-y-2">
                    <Label>Payment Method</Label>
                    <RadioGroup
                      value={activeGateway ?? undefined}
                      onValueChange={(value) =>
                        setGateway(value as PaymentGateway)
                      }
                      disabled={paying}
                    >
                      {subscription.availableGateways.map((option) => (
                        <div
                          key={option.gateway}
                          className="flex items-center gap-2"
                        >
                          <RadioGroupItem
                            id={`gateway-${option.gateway}`}
                            value={option.gateway}
                          />
                          <Label
                            htmlFor={`gateway-${option.gateway}`}
                            className="font-normal"
                          >
                            {option.gateway}
                          </Label>
                        </div>
                      ))}
                    </RadioGroup>
                  </div>
                )}

                <Button
                  className="w-full sm:w-auto"
                  disabled={
                    paying || subscription.availableGateways.length === 0
                  }
                  onClick={handlePay}
                >
                  {paying ? (
                    <>
                      <Loader2
                        className="size-4 animate-spin"
                        aria-hidden="true"
                      />
                      Processing…
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="size-4" aria-hidden="true" />
                      Pay{" "}
                      {formatNaira(subscription.cyclePricing[CYCLE_KEY[cycle]])}
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          </>
        ) : null}
      </QueryBoundary>

      <Card>
        <CardContent className="space-y-4">
          <h2 className="text-sm font-semibold text-foreground">
            Transaction History
          </h2>
          <QueryBoundary
            isLoading={historyQuery.isLoading}
            isError={historyQuery.isError}
            error={historyQuery.error}
            onRetry={() => historyQuery.refetch()}
            isRetrying={historyQuery.isFetching}
          >
            <SupportTransactionHistory
              payments={historyQuery.data ?? []}
              onViewReceipt={handleViewHistoryReceipt}
            />
          </QueryBoundary>
        </CardContent>
      </Card>

      <Dialog
        open={!!receipt}
        onOpenChange={(open) => !open && setReceipt(null)}
      >
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Receipt</DialogTitle>
          </DialogHeader>
          {receipt ? <SubscriptionReceiptCard receipt={receipt} /> : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-1">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-sm font-semibold text-foreground">{value}</p>
    </div>
  );
}
