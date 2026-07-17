"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopHeaderCard } from "@/components/features/coop/coop-header-card";
import { CoopLoansSummaryTable } from "@/components/features/coop/coop-loans-summary-table";
import { CoopMembersTable } from "@/components/features/coop/coop-members-table";
import { CoopSavingsSummaryTable } from "@/components/features/coop/coop-savings-summary-table";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { findCooperative } from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";

interface CooperativeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function CooperativeDetailsPage({
  params,
}: CooperativeDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = findCooperative(cooperatives, id);

  if (!coop) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that co-operative.
        </p>
        <Button variant="outline" onClick={() => router.push("/co-operatives")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Co-operatives
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/co-operatives")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <CoopHeaderCard coop={coop} />

      <Tabs defaultValue="members">
        <TabsList>
          <TabsTab value="members">Members</TabsTab>
          <TabsTab value="savings">Savings</TabsTab>
          <TabsTab value="loans">Loans</TabsTab>
          <TabsIndicator />
        </TabsList>
        <TabsPanel value="members">
          <CoopMembersTable coop={coop} />
        </TabsPanel>
        <TabsPanel value="savings">
          <CoopSavingsSummaryTable coop={coop} />
        </TabsPanel>
        <TabsPanel value="loans">
          <CoopLoansSummaryTable coop={coop} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
