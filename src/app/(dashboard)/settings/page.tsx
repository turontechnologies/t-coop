"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { AdminCooperativeSettingsTab } from "@/components/features/admin-settings/admin-cooperative-settings-tab";
import { AdminLoanSettingsTab } from "@/components/features/admin-settings/admin-loan-settings-tab";
import { AdminSavingsSettingsTab } from "@/components/features/admin-settings/admin-savings-settings-tab";
import { AdminSettingsProfileTab } from "@/components/features/admin-settings/admin-settings-profile-tab";
import { MemberSettingsTab } from "@/components/features/settings/member-settings-tab";
import { SettingsIntegrationsTab } from "@/components/features/settings/settings-integrations-tab";
import { SettingsLogsTab } from "@/components/features/settings/settings-logs-tab";
import { SettingsPaymentTab } from "@/components/features/settings/settings-payment-tab";
import { SettingsProfileTab } from "@/components/features/settings/settings-profile-tab";
import { SettingsUserManagementTab } from "@/components/features/settings/settings-user-management-tab";
import { SuperAdminUserManagementTab } from "@/components/features/settings/super-admin-user-management-tab";
import { useAuthStore } from "@/store/auth.store";

export default function SettingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  if (member.role === "member" || member.role === "support") {
    // Platform staff (support) have no co-operative of their own — same single-tab Settings
    // view as a member, not the co-op-scoped Savings/Loans/Co-operative/User Management tabs
    // the admin branch below renders. Personal details (name, address, bank account, etc.) live
    // on /profile already — this tab only covers settings-specific concerns (password change).
    return (
      <div className="pt-6">
        <Card>
          <CardContent>
            <Tabs defaultValue="account">
              <TabsList>
                <TabsTab value="account">Account</TabsTab>
                <TabsIndicator />
              </TabsList>

              <TabsPanel value="account">
                <MemberSettingsTab member={member} />
              </TabsPanel>
            </Tabs>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="pt-6">
      <Card>
        <CardContent>
          {member.role === "super_admin" ? (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTab value="profile">Profile</TabsTab>
                <TabsTab value="payment">Payment Settings</TabsTab>
                <TabsTab value="integrations">Integrations</TabsTab>
                <TabsTab value="users">User Management</TabsTab>
                <TabsTab value="logs">Logs</TabsTab>
                <TabsIndicator />
              </TabsList>

              <TabsPanel value="profile">
                <SettingsProfileTab member={member} />
              </TabsPanel>
              <TabsPanel value="payment">
                <SettingsPaymentTab />
              </TabsPanel>
              <TabsPanel value="integrations">
                <SettingsIntegrationsTab />
              </TabsPanel>
              <TabsPanel value="users">
                <SuperAdminUserManagementTab />
              </TabsPanel>
              <TabsPanel value="logs">
                <SettingsLogsTab />
              </TabsPanel>
            </Tabs>
          ) : (
            <Tabs defaultValue="profile">
              <TabsList>
                <TabsTab value="profile">Profile</TabsTab>
                <TabsTab value="savings">Savings Settings</TabsTab>
                <TabsTab value="loans">Loan Settings</TabsTab>
                <TabsTab value="cooperative">Co-operative Settings</TabsTab>
                <TabsTab value="users">User Management</TabsTab>
                <TabsIndicator />
              </TabsList>

              <TabsPanel value="profile">
                <AdminSettingsProfileTab member={member} />
              </TabsPanel>
              <TabsPanel value="savings">
                <AdminSavingsSettingsTab />
              </TabsPanel>
              <TabsPanel value="loans">
                <AdminLoanSettingsTab />
              </TabsPanel>
              <TabsPanel value="cooperative">
                <AdminCooperativeSettingsTab />
              </TabsPanel>
              <TabsPanel value="users">
                <SettingsUserManagementTab />
              </TabsPanel>
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
