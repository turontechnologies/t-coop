"use client";

import { AdminSupportView } from "@/components/features/support/admin-support-view";
import { useAuthStore } from "@/store/auth.store";

export default function SupportPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role !== "admin") return null;

  return (
    <div className="pt-6">
      <AdminSupportView />
    </div>
  );
}
