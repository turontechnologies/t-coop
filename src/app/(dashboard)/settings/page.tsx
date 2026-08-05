"use client";

import { Card, CardContent } from "@/components/ui/card";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { SettingsIntegrationsTab } from "@/components/features/settings/settings-integrations-tab";
import { SettingsLogsTab } from "@/components/features/settings/settings-logs-tab";
import { SettingsPaymentTab } from "@/components/features/settings/settings-payment-tab";
import { SettingsProfileTab } from "@/components/features/settings/settings-profile-tab";
import { SettingsUserManagementTab } from "@/components/features/settings/settings-user-management-tab";
import { useAuthStore } from "@/store/auth.store";

export default function SettingsPage() {
  const member = useAuthStore((state) => state.member);
  if (!member || member.role !== "super_admin") return null;

  return (
    <div className="pt-6">
      <Card>
        <CardContent>
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
              <SettingsUserManagementTab />
            </TabsPanel>
            <TabsPanel value="logs">
              <SettingsLogsTab />
            </TabsPanel>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}
