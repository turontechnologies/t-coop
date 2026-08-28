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
import { SettingsSubscriptionPlansTab } from "@/components/features/settings/settings-subscription-plans-tab";

export function SettingsPaymentTab() {
  return (
    <Tabs defaultValue="fees">
      <TabsList>
        <TabsTab value="fees">Fees &amp; Charges</TabsTab>
        <TabsTab value="account">Account Details</TabsTab>
        <TabsTab value="subscriptions">Subscription Plans</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="fees" className="space-y-6">
        <FeesChargesForm />
      </TabsPanel>
      <TabsPanel value="account">
        <CollectionAccountForm />
      </TabsPanel>
      <TabsPanel value="subscriptions">
        <SettingsSubscriptionPlansTab />
      </TabsPanel>
    </Tabs>
  );
}
