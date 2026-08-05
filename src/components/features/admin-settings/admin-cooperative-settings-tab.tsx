"use client";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { CooperativeDetailsForm } from "@/components/features/admin-settings/cooperative-details-form";
import { CoopBankAccountForm } from "@/components/features/admin-settings/coop-bank-account-form";

export function AdminCooperativeSettingsTab() {
  return (
    <Tabs defaultValue="coop">
      <TabsList>
        <TabsTab value="coop">Co-operative</TabsTab>
        <TabsTab value="bank">Bank Accounts</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="coop">
        <CooperativeDetailsForm />
      </TabsPanel>
      <TabsPanel value="bank">
        <CoopBankAccountForm />
      </TabsPanel>
    </Tabs>
  );
}
