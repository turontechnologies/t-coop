"use client";

import { AdminSavingsView } from "@/components/features/savings/admin-savings-view";
import { MemberSavingsView } from "@/components/features/savings/member-savings-view";
import { useAuthStore } from "@/store/auth.store";

export default function SavingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role === "super_admin") return null;

  return (
    <div className="pt-6">
      {member.role === "member" ? (
        <MemberSavingsView
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
