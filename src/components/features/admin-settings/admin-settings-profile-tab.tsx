"use client";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { AdminBankAccountForm } from "@/components/features/admin-settings/admin-bank-account-form";
import { SettingsProfileTab } from "@/components/features/settings/settings-profile-tab";
import type { AuthenticatedMember } from "@/types/auth";

interface AdminSettingsProfileTabProps {
  member: AuthenticatedMember;
}

export function AdminSettingsProfileTab({
  member,
}: AdminSettingsProfileTabProps) {
  return (
    <Tabs defaultValue="user">
      <TabsList>
        <TabsTab value="user">User</TabsTab>
        <TabsTab value="bank">Bank Accounts</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="user">
        <SettingsProfileTab member={member} />
      </TabsPanel>
      <TabsPanel value="bank">
        <AdminBankAccountForm member={member} />
      </TabsPanel>
    </Tabs>
  );
}
