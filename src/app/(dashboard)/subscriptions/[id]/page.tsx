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
import { SubscriptionCoopHeaderCard } from "@/components/features/coop/subscription-coop-header-card";
import { ManualSubscriptionPaymentModal } from "@/components/features/coop/manual-subscription-payment-modal";
import { SubscriptionHistoryTable } from "@/components/features/coop/subscription-history-table";
import { findCooperative, type CoopSubscriptionPayment } from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";

interface SubscriptionDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function SubscriptionDetailsPage({
  params,
}: SubscriptionDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const addSubscriptionPayment = useCoopStore(
    (state) => state.addSubscriptionPayment,
  );
  const coop = findCooperative(cooperatives, id);
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  if (!coop) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that co-operative.
        </p>
        <Button variant="outline" onClick={() => router.push("/subscriptions")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Subscriptions
        </Button>
      </div>
    );
  }

  const handleUpload = async (payload: {
    amountPaid: number;
    narration: string;
  }) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const payment: CoopSubscriptionPayment = {
      id: `coop-sub-${Date.now()}`,
      paymentRef: `${Date.now()}`,
      amountPaid: payload.amountPaid,
      method: "Manual",
      date: new Date().toISOString().slice(0, 10),
      narration: payload.narration,
      status: "Active",
    };
    addSubscriptionPayment(coop.id, payment);
    setBusy(false);
    setUploadOpen(false);
    toast.success("Payment recorded", {
      description: `${formatNaira(payload.amountPaid)} recorded for ${coop.name}.`,
    });
  };

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

      <SubscriptionCoopHeaderCard coop={coop} />

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
              <SubscriptionHistoryTable payments={coop.subscriptionPayments} />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <ManualSubscriptionPaymentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        coop={coop}
        busy={busy}
        onUpload={(payload) =>
          handleUpload({
            amountPaid: payload.amountPaid,
            narration: payload.narration,
          })
        }
      />
    </div>
  );
}
