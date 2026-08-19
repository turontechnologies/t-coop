"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopMemberHeaderCard } from "@/components/features/coop/coop-member-header-card";
import { CoopMemberLoansTable } from "@/components/features/coop/coop-member-loans-table";
import { CoopMemberSavingsTable } from "@/components/features/coop/coop-member-savings-table";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { CurrencyProvider } from "@/components/providers/currency-provider";
import { useCooperative } from "@/hooks/use-cooperative";
import { useCoopLoanRecords } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCoopSavingsRecords } from "@/hooks/use-coop-savings";

interface CoopMemberDetailsPageProps {
  params: Promise<{ id: string; memberId: string }>;
}

export default function CoopMemberDetailsPage({
  params,
}: CoopMemberDetailsPageProps) {
  const { id, memberId } = use(params);
  const router = useRouter();
  const coopQuery = useCooperative(id);
  const coop = coopQuery.data;
  const membersQuery = useCoopMembers(id);
  const member = membersQuery.data?.find((item) => item.id === memberId);
  const savingsQuery = useCoopSavingsRecords(id, { memberId });
  const savingsRecords = savingsQuery.data ?? [];
  const loansQuery = useCoopLoanRecords(id, { memberId });
  const loanRecords = loansQuery.data ?? [];

  const loading = coopQuery.isLoading || membersQuery.isLoading;
  const notFound = (!loading && !coop) || (!membersQuery.isLoading && !member);

  if (coopQuery.isError || membersQuery.isError || notFound) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that member.
        </p>
        <Button
          variant="outline"
          onClick={() => router.push(`/co-operatives/${id}`)}
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Co-operative
        </Button>
      </div>
    );
  }

  if (loading || !coop || !member) {
    return (
      <div className="space-y-4 pt-6">
        <div className="h-9 w-24 animate-pulse rounded-md bg-muted" />
        <div className="h-32 animate-pulse rounded-xl bg-muted" />
        <div className="h-56 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  return (
    <CurrencyProvider currency={coop.currency}>
      <div className="space-y-4 pt-6">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => router.push(`/co-operatives/${coop.id}`)}
          className="text-muted-foreground"
        >
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back
        </Button>

        <CoopMemberHeaderCard member={member} />

        <Tabs defaultValue="savings">
          <TabsList>
            <TabsTab value="savings">Savings</TabsTab>
            <TabsTab value="loans">Loans</TabsTab>
            <TabsIndicator />
          </TabsList>
          <TabsPanel value="savings">
            <CoopMemberSavingsTable coopId={coop.id} records={savingsRecords} />
          </TabsPanel>
          <TabsPanel value="loans">
            <CoopMemberLoansTable coopId={coop.id} records={loanRecords} />
          </TabsPanel>
        </Tabs>
      </div>
    </CurrencyProvider>
  );
}
