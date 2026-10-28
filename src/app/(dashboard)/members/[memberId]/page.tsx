"use client";

import { use } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CoopMemberHeaderCard } from "@/components/features/coop/coop-member-header-card";
import { CoopMemberLoansTable } from "@/components/features/coop/coop-member-loans-table";
import { CoopMemberSavingsTable } from "@/components/features/coop/coop-member-savings-table";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { useCoopLoanRecords } from "@/hooks/use-coop-loans";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCoopSavingsRecords } from "@/hooks/use-coop-savings";
import { useAuthStore } from "@/store/auth.store";
import { useCurrency } from "@/components/providers/currency-provider";
import { BorrowerHistoryCard } from "@/components/features/loans/borrower-history-card";

interface MemberDetailsPageProps {
  params: Promise<{ memberId: string }>;
}

export default function MemberDetailsPage({ params }: MemberDetailsPageProps) {
  const { memberId } = use(params);
  const router = useRouter();
  const authMember = useAuthStore((state) => state.member);
  const coopId = authMember?.id;

  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopMembers(coopId);
  const { data: savingsRecords = [] } = useCoopSavingsRecords(coopId, {
    memberId,
  });
  const { data: loanRecords = [] } = useCoopLoanRecords(coopId, { memberId });
  const currency = useCurrency();

  if (!authMember) return null;

  const member = members.find((item) => item.id === memberId);

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/members")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load that member"
      >
        {!member ? (
          <p className="text-sm text-muted-foreground">
            We couldn&apos;t find that member.
          </p>
        ) : (
          <>
            <CoopMemberHeaderCard member={member} />

            <Tabs defaultValue="savings">
              <TabsList>
                <TabsTab value="savings">Savings</TabsTab>
                <TabsTab value="loans">Loans</TabsTab>
                <TabsTab value="history">Loan History</TabsTab>
                <TabsIndicator />
              </TabsList>
              <TabsPanel value="savings">
                <CoopMemberSavingsTable
                  coopId={coopId as string}
                  records={savingsRecords}
                />
              </TabsPanel>
              <TabsPanel value="loans">
                <CoopMemberLoansTable
                  coopId={coopId as string}
                  records={loanRecords}
                />
              </TabsPanel>
              <TabsPanel value="history">
                <BorrowerHistoryCard
                  coopId={authMember.cooperativeId ?? coopId}
                  memberId={member.id}
                  currency={currency}
                />
              </TabsPanel>
            </Tabs>
          </>
        )}
      </QueryBoundary>
    </div>
  );
}
