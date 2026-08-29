"use client";

import { AdminLoansView } from "@/components/features/loans/admin-loans-view";
import { MemberLoansView } from "@/components/features/loans/member-loans-view";
import { SuperAdminLoansView } from "@/components/features/loans/super-admin-loans-view";
import { useAuthStore } from "@/store/auth.store";

export default function LoansPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  return (
    <div className="pt-6">
      {member.role === "super_admin" ? (
        <SuperAdminLoansView />
      ) : member.role === "member" ? (
        <MemberLoansView
          coopId={member.cooperativeId as string}
          memberId={member.id}
          memberName={member.name}
        />
      ) : (
        <AdminLoansView member={member} />
      )}
    </div>
  );
}
