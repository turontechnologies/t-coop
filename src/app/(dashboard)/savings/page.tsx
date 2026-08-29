"use client";

import { AdminSavingsView } from "@/components/features/savings/admin-savings-view";
import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import { SuperAdminSavingsView } from "@/components/features/savings/super-admin-savings-view";
import { useAuthStore } from "@/store/auth.store";

export default function SavingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  return (
    <div className="pt-6">
      {member.role === "super_admin" ? (
        <SuperAdminSavingsView />
      ) : member.role === "member" ? (
        <MemberSavingsView
          coopId={member.cooperativeId as string}
          memberId={member.id}
          memberName={member.name}
          memberEmail={member.email}
        />
      ) : (
        <AdminSavingsView member={member} />
      )}
    </div>
  );
}
