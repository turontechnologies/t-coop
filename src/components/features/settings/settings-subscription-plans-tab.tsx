"use client";

import { useState } from "react";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { SubscriptionPlansTable } from "@/components/features/settings/subscription-plans-table";
import { SubscriptionPlanModal } from "@/components/features/settings/subscription-plan-modal";
import { useSubscriptionPlans } from "@/hooks/use-subscription-plans";
import { useSubscriptionPlanMutations } from "@/hooks/use-subscription-plan-mutations";
import type {
  SubscriptionPlan,
  SubscriptionPlanType,
} from "@/types/subscription";

export function SettingsSubscriptionPlansTab() {
  const plansQuery = useSubscriptionPlans();
  const { remove } = useSubscriptionPlanMutations();
  const [modalOpen, setModalOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<
    SubscriptionPlan | undefined
  >();
  const [activeType, setActiveType] =
    useState<SubscriptionPlanType>("New Subscription");

  const plans = plansQuery.data ?? [];
  const newPlans = plans.filter((plan) => plan.type === "New Subscription");
  const renewalPlans = plans.filter((plan) => plan.type === "Renewal");

  const openAdd = () => {
    setEditingPlan(undefined);
    setModalOpen(true);
  };

  const openEdit = (plan: SubscriptionPlan) => {
    setEditingPlan(plan);
    setModalOpen(true);
  };

  const handleDelete = async (plan: SubscriptionPlan) => {
    try {
      await remove.mutateAsync(plan.id);
      toast.success("Plan deleted", {
        description: `${plan.label} was removed.`,
      });
    } catch (error) {
      toast.error("Couldn't delete plan", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-sm font-semibold text-foreground">
            Subscription Plans
          </h2>
          <p className="text-xs text-muted-foreground">
            What a co-op pays to subscribe or renew, and for how long — shown on
            their own Support page. Add as many durations as you want; New
            Subscription and Renewal are priced separately.
          </p>
        </div>
        <Button onClick={openAdd}>
          <Plus className="size-4" aria-hidden="true" />
          Add Plan
        </Button>
      </div>

      <QueryBoundary
        isLoading={plansQuery.isLoading}
        isError={plansQuery.isError}
        error={plansQuery.error}
        onRetry={() => plansQuery.refetch()}
        isRetrying={plansQuery.isFetching}
      >
        <Tabs
          defaultValue="new"
          onValueChange={(value) =>
            setActiveType(value === "renewal" ? "Renewal" : "New Subscription")
          }
        >
          <TabsList>
            <TabsTab value="new">New Subscription</TabsTab>
            <TabsTab value="renewal">Renewal</TabsTab>
            <TabsIndicator />
          </TabsList>

          <TabsPanel value="new">
            <SubscriptionPlansTable
              plans={newPlans}
              onEdit={openEdit}
              onDelete={handleDelete}
              emptyMessage="No New Subscription plans yet — add one above."
            />
          </TabsPanel>
          <TabsPanel value="renewal">
            <SubscriptionPlansTable
              plans={renewalPlans}
              onEdit={openEdit}
              onDelete={handleDelete}
              emptyMessage="No Renewal plans yet — add one above."
            />
          </TabsPanel>
        </Tabs>
      </QueryBoundary>

      <SubscriptionPlanModal
        open={modalOpen}
        onOpenChange={setModalOpen}
        plan={editingPlan}
        defaultType={activeType}
      />
    </div>
  );
}
