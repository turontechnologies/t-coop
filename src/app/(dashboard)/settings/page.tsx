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
import { useTabAccess } from "@/hooks/use-permission";
import { useAuthStore } from "@/store/auth.store";

const MODULE = "Settings";

export default function SettingsPage() {
  const member = useAuthStore((state) => state.member);
  const profileAccess = useTabAccess(MODULE, "Profile");
  const savingsAccess = useTabAccess(MODULE, "Savings Settings");
  const loansAccess = useTabAccess(MODULE, "Loan Settings");
  const cooperativeAccess = useTabAccess(MODULE, "Co-operative Settings");
  const usersAccess = useTabAccess(MODULE, "User Management");
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
          ) : profileAccess === null &&
            savingsAccess === null &&
            loansAccess === null &&
            cooperativeAccess === null &&
            usersAccess === null ? (
            <p className="text-sm text-muted-foreground">
              You don&apos;t have access to any part of Settings.
            </p>
          ) : (
            <Tabs
              defaultValue={
                profileAccess !== null
                  ? "profile"
                  : savingsAccess !== null
                    ? "savings"
                    : loansAccess !== null
                      ? "loans"
                      : cooperativeAccess !== null
                        ? "cooperative"
                        : "users"
              }
            >
              <TabsList>
                {profileAccess !== null ? (
                  <TabsTab value="profile">Profile</TabsTab>
                ) : null}
                {savingsAccess !== null ? (
                  <TabsTab value="savings">Savings Settings</TabsTab>
                ) : null}
                {loansAccess !== null ? (
                  <TabsTab value="loans">Loan Settings</TabsTab>
                ) : null}
                {cooperativeAccess !== null ? (
                  <TabsTab value="cooperative">Co-operative Settings</TabsTab>
                ) : null}
                {usersAccess !== null ? (
                  <TabsTab value="users">User Management</TabsTab>
                ) : null}
                <TabsIndicator />
              </TabsList>

              {profileAccess !== null ? (
                <TabsPanel value="profile">
                  <AdminSettingsProfileTab member={member} />
                </TabsPanel>
              ) : null}
              {savingsAccess !== null ? (
                <TabsPanel value="savings">
                  <AdminSavingsSettingsTab />
                </TabsPanel>
              ) : null}
              {loansAccess !== null ? (
                <TabsPanel value="loans">
                  <AdminLoanSettingsTab />
                </TabsPanel>
              ) : null}
              {cooperativeAccess !== null ? (
                <TabsPanel value="cooperative">
                  <AdminCooperativeSettingsTab />
                </TabsPanel>
              ) : null}
              {usersAccess !== null ? (
                <TabsPanel value="users">
                  <SettingsUserManagementTab />
                </TabsPanel>
              ) : null}
            </Tabs>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
