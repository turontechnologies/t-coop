"use client";

import { use, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
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
import { SubscriptionDetailHeaderCard } from "@/components/features/coop/subscription-detail-header-card";
import { ManualSubscriptionPaymentModal } from "@/components/features/coop/manual-subscription-payment-modal";
import { SubscriptionHistoryTable } from "@/components/features/coop/subscription-history-table";
import { useCooperative } from "@/hooks/use-cooperative";
import { useSubscriptions } from "@/hooks/use-subscriptions";
import { useSubscriptionHistory } from "@/hooks/use-subscription-history";
import { useRecordSubscriptionPayment } from "@/hooks/use-record-subscription-payment";
import { formatNaira } from "@/lib/format";
import type { BillingCycle } from "@/types/subscription";

interface SubscriptionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function SubscriptionDetailsPage({
  params,
}: SubscriptionDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const [uploadOpen, setUploadOpen] = useState(false);

  const coopQuery = useCooperative(id);
  const subscriptionsQuery = useSubscriptions();
  const historyQuery = useSubscriptionHistory(id);
  const recordPayment = useRecordSubscriptionPayment(id);

  const subscription = subscriptionsQuery.data?.find(
    (row) => row.coopId === id,
  );

  const handleUpload = async (payload: {
    coopId: string;
    amountPaid: number;
    cycle: BillingCycle;
  }) => {
    try {
      const result = await recordPayment.mutateAsync({
        amountPaid: payload.amountPaid,
        cycle: payload.cycle,
      });
      setUploadOpen(false);
      toast.success("Payment recorded", {
        description: `${formatNaira(payload.amountPaid)} recorded (${result.payment.type.toLowerCase()}) — next renewal ${result.nextRenewalDate}.`,
      });
    } catch (error) {
      toast.error("Couldn't record payment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  if (coopQuery.isError) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          {coopQuery.error instanceof Error
            ? coopQuery.error.message
            : "We couldn't find that co-operative."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => coopQuery.refetch()}
            disabled={coopQuery.isFetching}
          >
            {coopQuery.isFetching ? "Retrying…" : "Try again"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/subscriptions")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Subscriptions
          </Button>
        </div>
      </div>
    );
  }

  if (coopQuery.isLoading || !coopQuery.data) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  const coop = coopQuery.data;

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/subscriptions")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <QueryBoundary
        isLoading={subscriptionsQuery.isLoading}
        isError={subscriptionsQuery.isError}
        error={subscriptionsQuery.error}
        onRetry={() => subscriptionsQuery.refetch()}
        isRetrying={subscriptionsQuery.isFetching}
      >
        {subscription ? (
          <SubscriptionDetailHeaderCard
            coop={coop}
            subscription={subscription}
          />
        ) : null}
      </QueryBoundary>

      <Card>
        <CardContent>
          <Tabs defaultValue="history">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <TabsList>
                <TabsTab value="history">Subscription History</TabsTab>
                <TabsIndicator />
              </TabsList>
              <Button onClick={() => setUploadOpen(true)}>Manual Upload</Button>
            </div>

            <TabsPanel value="history">
              <QueryBoundary
                isLoading={historyQuery.isLoading}
                isError={historyQuery.isError}
                error={historyQuery.error}
                onRetry={() => historyQuery.refetch()}
                isRetrying={historyQuery.isFetching}
              >
                <SubscriptionHistoryTable payments={historyQuery.data ?? []} />
              </QueryBoundary>
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <ManualSubscriptionPaymentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        coop={{ id: coop.id, name: coop.name }}
        busy={recordPayment.isPending}
        onUpload={handleUpload}
      />
    </div>
  );
}
