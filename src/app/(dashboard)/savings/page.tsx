"use client";

import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import { useAuthStore } from "@/store/auth.store";

export default function SavingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role !== "member") return null;

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
