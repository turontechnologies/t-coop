"use client";

import { SuperAdminSubscriptionsView } from "@/components/features/coop/super-admin-subscriptions-view";
import { useAuthStore } from "@/store/auth.store";

export default function SubscriptionsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role !== "super_admin") return null;

  return (
    <div className="pt-6">
      <SuperAdminSubscriptionsView />
    </div>
  );
}
