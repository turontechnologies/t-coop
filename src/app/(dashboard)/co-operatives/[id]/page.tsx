"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
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
import { useCooperative } from "@/hooks/use-cooperative";
import type { Cooperative } from "@/lib/coop-data";
import { CurrencyProvider } from "@/components/providers/currency-provider";

interface CooperativeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function CooperativeDetailsPage({
  params,
}: CooperativeDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialTab =
    searchParams.get("tab") === "savings" ? "savings" : "members";
  const {
    data: coop,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useCooperative(id);

  if (isError) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          {error instanceof Error
            ? error.message
            : "We couldn't find that co-operative."}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Try again"}
          </Button>
          <Button
            variant="outline"
            onClick={() => router.push("/co-operatives")}
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Back to Co-operatives
          </Button>
        </div>
      </div>
    );
  }

  if (isLoading || !coop) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
        <div className="h-72 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  // Members/Savings/Loans-within-a-co-op aren't cut over to the real
  // backend yet — this bridges the real header fields into the legacy
  // mock `Cooperative` shape those three tabs still expect, with empty
  // record arrays (an honest "nothing here yet" rather than fake mock
  // data for a co-op that's now real).
  const legacyCoop: Cooperative = {
    ...coop,
    members: [],
    savings: [],
    loans: [],
    savingsRequests: [],
    subscriptionFee: 0,
    subscriptionPayments: [],
  };

  return (
    <CurrencyProvider currency={coop.currency}>
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

        <Tabs defaultValue={initialTab}>
          <TabsList>
            <TabsTab value="members">Members</TabsTab>
            <TabsTab value="savings">Savings</TabsTab>
            <TabsTab value="loans">Loans</TabsTab>
            <TabsIndicator />
          </TabsList>
          <TabsPanel value="members">
            <CoopMembersTable coop={legacyCoop} />
          </TabsPanel>
          <TabsPanel value="savings">
            <CoopSavingsSummaryTable coop={legacyCoop} />
          </TabsPanel>
          <TabsPanel value="loans">
            <CoopLoansSummaryTable coop={legacyCoop} />
          </TabsPanel>
        </Tabs>
      </div>
    </CurrencyProvider>
  );
}
