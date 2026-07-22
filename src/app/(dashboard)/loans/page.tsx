"use client";

import { AdminLoansView } from "@/components/features/loans/admin-loans-view";
import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { useAuthStore } from "@/store/auth.store";

export default function LoansPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role === "super_admin") return null;

  return (
    <div className="pt-6">
      {member.role === "member" ? (
        <MemberLoansView memberId={member.id} memberName={member.name} />
      ) : (
        <AdminLoansView member={member} />
      )}
    </div>
  );
}
