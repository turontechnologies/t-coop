"use client";

import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { CollectionAccountForm } from "@/components/features/settings/collection-account-form";
import { CoopPlatformFeesSection } from "@/components/features/settings/coop-platform-fees";
import { FeesChargesForm } from "@/components/features/settings/fees-charges-form";
import { PlatformEarningsPanel } from "@/components/features/settings/platform-earnings";
import { SettingsSubscriptionPlansTab } from "@/components/features/settings/settings-subscription-plans-tab";

export function SettingsPaymentTab() {
  return (
    <Tabs defaultValue="fees">
      <TabsList>
        <TabsTab value="fees">Fees &amp; Charges</TabsTab>
        <TabsTab value="earnings">Earnings</TabsTab>
        <TabsTab value="account">Account Details</TabsTab>
        <TabsTab value="subscriptions">Subscription Plans</TabsTab>
        <TabsIndicator />
      </TabsList>

      <TabsPanel value="fees" className="space-y-10">
        <FeesChargesForm />
        <div className="h-px bg-border" />
        <CoopPlatformFeesSection />
      </TabsPanel>
      <TabsPanel value="earnings">
        <PlatformEarningsPanel />
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
