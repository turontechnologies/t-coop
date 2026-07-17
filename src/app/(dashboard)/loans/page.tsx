"use client";

import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { MembersLoansOverview } from "@/components/features/loans/members-loans-overview";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth.store";

export default function LoansPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  if (member.role === "member") {
    return (
      <div className="pt-6">
        <MemberLoansView memberId={member.id} memberName={member.name} />
      </div>
    );
  }

  if (member.role === "super_admin") {
    return (
      <div className="pt-6">
        <MembersLoansOverview />
      </div>
    );
  }

  return (
    <div className="pt-6">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTab value="members">Members Loans</TabsTab>
          <TabsTab value="mine">My Loans</TabsTab>
          <TabsIndicator />
        </TabsList>
        <TabsPanel value="members">
          <MembersLoansOverview />
        </TabsPanel>
        <TabsPanel value="mine">
          <MemberLoansView memberId={member.id} memberName={member.name} />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
