"use client";

import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import { MembersSavingsOverview } from "@/components/features/savings/members-savings-overview";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { useAuthStore } from "@/store/auth.store";

export default function SavingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  if (member.role === "member") {
    return (
      <div className="pt-6">
        <MemberSavingsView
          memberId={member.id}
          memberName={member.name}
          memberEmail={member.email}
        />
      </div>
    );
  }

  if (member.role === "super_admin") {
    return (
      <div className="pt-6">
        <MembersSavingsOverview />
      </div>
    );
  }

  return (
    <div className="pt-6">
      <Tabs defaultValue="members">
        <TabsList>
          <TabsTab value="members">Members Savings</TabsTab>
          <TabsTab value="mine">My Savings</TabsTab>
          <TabsIndicator />
        </TabsList>
        <TabsPanel value="members">
          <MembersSavingsOverview />
        </TabsPanel>
        <TabsPanel value="mine">
          <MemberSavingsView
            memberId={member.id}
            memberName={member.name}
            memberEmail={member.email}
          />
        </TabsPanel>
      </Tabs>
    </div>
  );
}
