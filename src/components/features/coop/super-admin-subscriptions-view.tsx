"use client";

import { useState } from "react";
import { CreditCard } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { ManualSubscriptionPaymentModal } from "@/components/features/coop/manual-subscription-payment-modal";
import { SuperAdminSubscriptionsTable } from "@/components/features/coop/super-admin-subscriptions-table";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useSubscriptionsSummary } from "@/hooks/use-subscriptions-summary";
import { subscriptionService } from "@/services/subscription.service";
import { useQueryClient } from "@tanstack/react-query";
import { formatNaira } from "@/lib/format";
import type { BillingCycle } from "@/types/subscription";

export function SuperAdminSubscriptionsView() {
  const subscriptionsQuery = useSubscriptions();
  const summaryQuery = useSubscriptionsSummary();
  const cooperativesQuery = useCooperatives();
  const queryClient = useQueryClient();

  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const handleUpload = async (payload: {
    coopId: string;
    amountPaid: number;
    cycle: BillingCycle;
  }) => {
    setBusy(true);
    try {
      const result = await subscriptionService.recordSubscriptionPayment(
        payload.coopId,
        { amountPaid: payload.amountPaid, cycle: payload.cycle },
      );
      await queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
      await queryClient.invalidateQueries({ queryKey: ["cooperatives"] });
      setUploadOpen(false);
      const coopName =
        cooperativesQuery.data?.find((c) => c.id === payload.coopId)?.name ??
        payload.coopId;
      toast.success("Payment recorded", {
        description: `${formatNaira(payload.amountPaid)} recorded for ${coopName} (${result.payment.type.toLowerCase()}) — next renewal ${result.nextRenewalDate}.`,
      });
    } catch (error) {
      toast.error("Couldn't record payment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-sm font-semibold text-foreground">Quick Summary</h2>

      <div className="grid grid-cols-1 gap-4 sm:max-w-xs">
        <Card>
          <CardContent className="flex items-start justify-between gap-3">
            <div className="space-y-1.5">
              <p className="text-sm text-muted-foreground">Mgt Fees Received</p>
              <p className="text-xl font-semibold text-foreground sm:text-2xl">
                {formatNaira(summaryQuery.data?.mgtFeesReceived ?? 0)}
              </p>
            </div>
            <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary/10 text-primary">
              <CreditCard className="size-5" aria-hidden="true" />
            </span>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardContent>
          <Tabs defaultValue="subscriptions">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTab value="subscriptions">Subscriptions</TabsTab>
                <TabsIndicator />
              </TabsList>
              <Button onClick={() => setUploadOpen(true)}>Manual Upload</Button>
            </div>

            <TabsPanel value="subscriptions">
              <QueryBoundary
                isLoading={subscriptionsQuery.isLoading}
                isError={subscriptionsQuery.isError}
                error={subscriptionsQuery.error}
                onRetry={() => subscriptionsQuery.refetch()}
                isRetrying={subscriptionsQuery.isFetching}
              >
                <SuperAdminSubscriptionsTable
                  subscriptions={subscriptionsQuery.data ?? []}
                />
              </QueryBoundary>
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <ManualSubscriptionPaymentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        cooperatives={cooperativesQuery.data ?? []}
        busy={busy}
        onUpload={handleUpload}
      />
    </div>
  );
}
