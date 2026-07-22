"use client";

import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { useAuthStore } from "@/store/auth.store";

export default function LoansPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role !== "member") return null;

  return (
    <div className="pt-6">
      <MemberLoansView memberId={member.id} memberName={member.name} />
    </div>
  );
}
