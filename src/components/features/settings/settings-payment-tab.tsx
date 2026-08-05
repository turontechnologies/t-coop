"use client";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { CollectionAccountForm } from "@/components/features/settings/collection-account-form";
import { FeesChargesForm } from "@/components/features/settings/fees-charges-form";

export function SettingsPaymentTab() {
  return (
    <Tabs defaultValue="fees">
      <TabsList>
        <TabsTab value="fees">Fees &amp; Charges</TabsTab>
        <TabsTab value="account">Account Details</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="fees">
        <FeesChargesForm />
      </TabsPanel>
      <TabsPanel value="account">
        <CollectionAccountForm />
      </TabsPanel>
    </Tabs>
  );
}
