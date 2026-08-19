"use client";

import { use } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopHeaderCard } from "@/components/features/coop/coop-header-card";
import { CoopLoansSummaryTable } from "@/components/features/coop/coop-loans-summary-table";
import { CoopMembersTable } from "@/components/features/coop/coop-members-table";
import { CoopSavingsSummaryTable } from "@/components/features/coop/coop-savings-summary-table";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanTypes } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
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
  const { data: savingsTypes } = useCoopSavingsTypes(id);
  const { data: loanTypes } = useCoopLoanTypes(id);
  const membersQuery = useCoopMembers(id);

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
            <QueryBoundary
              isLoading={membersQuery.isLoading}
              isError={membersQuery.isError}
              error={membersQuery.error}
              onRetry={() => membersQuery.refetch()}
              isRetrying={membersQuery.isFetching}
            >
              <CoopMembersTable
                coopId={coop.id}
                members={membersQuery.data ?? []}
              />
            </QueryBoundary>
          </TabsPanel>
          <TabsPanel value="savings">
            <CoopSavingsSummaryTable
              totalsByType={savingsTypes ?? []}
              currency={coop.currency}
              coopId={coop.id}
            />
          </TabsPanel>
          <TabsPanel value="loans">
            <CoopLoansSummaryTable
              totalsByType={loanTypes ?? []}
              currency={coop.currency}
              coopId={coop.id}
            />
          </TabsPanel>
        </Tabs>
      </div>
    </CurrencyProvider>
  );
}
