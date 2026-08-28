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
import { CoopCurrencyForm } from "@/components/features/admin-settings/coop-currency-form";
import { TransferAdminForm } from "@/components/features/admin-settings/transfer-admin-form";

export function AdminCooperativeSettingsTab() {
  return (
    <Tabs defaultValue="coop">
      <TabsList>
        <TabsTab value="coop">Co-operative</TabsTab>
        <TabsTab value="bank">Bank Accounts</TabsTab>
        <TabsTab value="transfer">Transfer Admin</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="coop" className="space-y-6">
        <CoopCurrencyForm />
        <CooperativeDetailsForm />
      </TabsPanel>
      <TabsPanel value="bank">
        <CoopBankAccountForm />
      </TabsPanel>
      <TabsPanel value="transfer">
        <TransferAdminForm />
      </TabsPanel>
    </Tabs>
  );
}
