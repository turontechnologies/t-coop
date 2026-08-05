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
import { ManualSubscriptionPaymentModal } from "@/components/features/coop/manual-subscription-payment-modal";
import { SuperAdminSubscriptionsTable } from "@/components/features/coop/super-admin-subscriptions-table";
import {
  allCoopsSubscriptionRevenue,
  findCooperative,
  type CoopSubscriptionPayment,
} from "@/lib/coop-data";
import { formatNaira } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";

export function SuperAdminSubscriptionsView() {
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const addSubscriptionPayment = useCoopStore(
    (state) => state.addSubscriptionPayment,
  );
  const [uploadOpen, setUploadOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  const mgtFeesReceived = allCoopsSubscriptionRevenue(cooperatives);

  const handleUpload = async (payload: {
    coopId: string;
    amountPaid: number;
    narration: string;
  }) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    const coop = findCooperative(cooperatives, payload.coopId);
    const payment: CoopSubscriptionPayment = {
      id: `coop-sub-${Date.now()}`,
      paymentRef: `${Date.now()}`,
      amountPaid: payload.amountPaid,
      method: "Manual",
      date: new Date().toISOString().slice(0, 10),
      narration: payload.narration,
      status: "Active",
    };
    addSubscriptionPayment(payload.coopId, payment);
    setBusy(false);
    setUploadOpen(false);
    toast.success("Payment recorded", {
      description: `${formatNaira(payload.amountPaid)} recorded for ${coop?.name ?? payload.coopId}.`,
    });
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
                {formatNaira(mgtFeesReceived)}
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
              <SuperAdminSubscriptionsTable cooperatives={cooperatives} />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>

      <ManualSubscriptionPaymentModal
        open={uploadOpen}
        onOpenChange={setUploadOpen}
        cooperatives={cooperatives}
        busy={busy}
        onUpload={handleUpload}
      />
    </div>
  );
}
