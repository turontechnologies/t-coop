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
import {
  ADMIN_DIRECTORY_COOP_ID,
  findDirectoryMember,
  getDirectoryCoop,
} from "@/lib/member-directory";
import { useCoopStore } from "@/store/coop.store";

interface MemberDetailsPageProps {
  params: Promise<{ memberId: string }>;
}

export default function MemberDetailsPage({ params }: MemberDetailsPageProps) {
  const { memberId } = use(params);
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const coop = getDirectoryCoop(cooperatives);
  const member = findDirectoryMember(cooperatives, memberId);

  const savingsRecords = useMemo(
    () => coop?.savings.filter((record) => record.memberId === memberId) ?? [],
    [coop, memberId],
  );
  const loanRecords = useMemo(
    () => coop?.loans.filter((record) => record.memberId === memberId) ?? [],
    [coop, memberId],
  );

  if (!member) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that member.
        </p>
        <Button variant="outline" onClick={() => router.push("/members")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Members Directory
        </Button>
      </div>
    );
  }

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

      <CoopMemberHeaderCard member={member} />

      <Tabs defaultValue="savings">
        <TabsList>
          <TabsTab value="savings">Savings</TabsTab>
          <TabsTab value="loans">Loans</TabsTab>
          <TabsIndicator />
        </TabsList>
        <TabsPanel value="savings">
          <CoopMemberSavingsTable
            coopId={ADMIN_DIRECTORY_COOP_ID}
            records={savingsRecords}
          />
        </TabsPanel>
        <TabsPanel value="loans">
          <CoopMemberLoansTable
            coopId={ADMIN_DIRECTORY_COOP_ID}
            records={loanRecords}
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
