"use client";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { formatDateLong, formatNaira } from "@/lib/format";
import { cn } from "@/lib/utils";
import type { CooperativeSummary } from "@/types/cooperative";
import type { SubscriptionSummary } from "@/types/subscription";

interface SubscriptionDetailHeaderCardProps {
  coop: CooperativeSummary;
  subscription: SubscriptionSummary;
}

export function SubscriptionDetailHeaderCard({
  coop,
  subscription,
}: SubscriptionDetailHeaderCardProps) {
  const isActive = subscription.status === "Active";

  return (
    <Card>
      <CardContent className="space-y-5">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <h2 className="text-sm font-semibold text-foreground">
            Subscription Details
          </h2>
          <Badge
            variant={isActive ? "secondary" : "destructive"}
            className={cn(isActive && "bg-success/15 text-success")}
          >
            {isActive ? "Active" : "Overdue"}
          </Badge>
        </div>

        <div className="grid grid-cols-1 gap-x-8 gap-y-5 sm:grid-cols-2 lg:grid-cols-4">
          <Field label="Co-op ID" value={coop.id} />
          <Field label="Co-op Name" value={coop.name} />
          <Field label="Admin" value={coop.adminName} />
          <Field label="Contact Email" value={coop.contactEmail} />
          <Field
            label="Subscription Fee"
            value={formatNaira(subscription.subscriptionFee)}
          />
          <Field
            label="Billing Cycle"
            value={subscription.subscriptionCycle ?? "Not subscribed yet"}
          />
          <Field
            label="Revenue Earned"
            value={formatNaira(subscription.revenueEarned)}
          />
          <Field
            label={isActive ? "Renews On" : "Expired On"}
            value={
              subscription.subscriptionExpiresAt
                ? formatDateLong(new Date(subscription.subscriptionExpiresAt))
                : "—"
            }
          />
        </div>

        {!isActive ? (
          <p className="rounded-lg bg-destructive/10 px-3 py-2 text-sm text-destructive">
            This co-operative can&apos;t use the platform until a payment is
            recorded below — every admin/member action is blocked while its
            subscription is overdue.
          </p>
        ) : null}
      </CardContent>
    </Card>
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
