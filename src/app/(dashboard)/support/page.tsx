"use client";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { AdminSupportView } from "@/components/features/support/admin-support-view";
import { AdminTicketsTab } from "@/components/features/support/admin-tickets-tab";
import { MemberSupportView } from "@/components/features/support/member-support-view";
import { SuperAdminSupportView } from "@/components/features/support/super-admin-support-view";
import { useCooperativeBranding } from "@/hooks/use-cooperative";
import { useAuthStore } from "@/store/auth.store";

export default function SupportPage() {
  const member = useAuthStore((state) => state.member);
  const brandingCoopId =
    member?.role === "admin" ? member.id : (member?.cooperativeId ?? null);
  const { data: branding } = useCooperativeBranding(brandingCoopId);

  if (!member) return null;

  if (member.role === "super_admin") {
    return (
      <div className="pt-6">
        <SuperAdminSupportView />
      </div>
    );
  }

  if (member.role === "member") {
    return (
      <div className="pt-6">
        <MemberSupportView
          member={member}
          cooperativeName={branding?.name ?? "Your co-operative"}
          recipientLabel="your co-operative's admin"
        />
      </div>
    );
  }

  if (member.role === "admin") {
    // A subscription-expired admin gets force-redirected here from every other page (see the
    // dashboard layout) — that's their one actionable path to unlock everything else, so it has
    // to be what they land on, not the ticket queue.
    const defaultTab =
      member.subscriptionActive === false ? "subscription" : "tickets";
    return (
      <div className="space-y-6 pt-6">
        <Tabs defaultValue={defaultTab}>
          <TabsList>
            <TabsTab value="tickets">Tickets</TabsTab>
            <TabsTab value="subscription">Subscription</TabsTab>
            <TabsIndicator />
          </TabsList>

          <TabsPanel value="tickets">
            <AdminTicketsTab
              member={member}
              cooperativeName={branding?.name ?? member.name}
            />
          </TabsPanel>

          <TabsPanel value="subscription">
            <AdminSupportView />
          </TabsPanel>
        </Tabs>
      </div>
    );
  }

  return null;
}
