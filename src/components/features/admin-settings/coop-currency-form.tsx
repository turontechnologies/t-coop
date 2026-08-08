"use client";

import { useState } from "react";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CoopCurrencyDisplay } from "@/components/features/coop/coop-currency-display";
import { CurrencyCombobox } from "@/components/features/admin-settings/currency-combobox";
import { getDirectoryCoop } from "@/lib/member-directory";
import { useCoopStore } from "@/store/coop.store";

export function CoopCurrencyForm() {
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const setCoopCurrency = useCoopStore((state) => state.setCoopCurrency);
  const coop = getDirectoryCoop(cooperatives);
  const [saving, setSaving] = useState(false);

  if (!coop) return null;

  const handleChange = async (currency: string) => {
    if (currency === coop.currency) return;
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    setCoopCurrency(coop.id, currency);
    setSaving(false);
    toast.success("Currency updated", {
      description: `Your members now see amounts recorded in ${currency}.`,
    });
  };

  return (
    <Card>
      <CardContent className="space-y-4">
        <div>
          <p className="text-sm font-medium text-foreground">Currency</p>
          <p className="text-xs text-muted-foreground">
            Set the currency your members save and borrow in. Only you, as this
            co-operative&apos;s admin, can change it.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-[260px_1fr] sm:items-start">
          <CurrencyCombobox
            value={coop.currency}
            onChange={(code) => void handleChange(code)}
            disabled={saving}
          />

          <div className="flex items-center gap-2">
            {saving ? (
              <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Saving…
              </span>
            ) : (
              <div className="w-full max-w-xs">
                <CoopCurrencyDisplay currency={coop.currency} variant="full" />
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
