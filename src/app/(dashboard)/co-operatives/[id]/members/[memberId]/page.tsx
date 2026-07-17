"use client";

import { use, useMemo } from "react";
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
import { findCoopMember, findCooperative } from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";

interface CoopMemberDetailsPageProps {
  params: Promise<{ id: string; memberId: string }>;
}

export default function CoopMemberDetailsPage({
  params,
}: CoopMemberDetailsPageProps) {
  const { id, memberId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = findCooperative(cooperatives, id);
  const member = findCoopMember(coop, memberId);

  const savingsRecords = useMemo(
    () => coop?.savings.filter((record) => record.memberId === memberId) ?? [],
    [coop, memberId],
  );
  const loanRecords = useMemo(
    () => coop?.loans.filter((record) => record.memberId === memberId) ?? [],
    [coop, memberId],
  );

  if (!coop || !member) {
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

  return (
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
  );
}
