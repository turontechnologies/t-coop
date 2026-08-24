"use client";

import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent } from "@/components/ui/card";
import { CoopCurrencyDisplay } from "@/components/features/coop/coop-currency-display";
import { CurrencyCombobox } from "@/components/features/admin-settings/currency-combobox";
import { useCooperative } from "@/hooks/use-cooperative";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateCooperative } from "@/hooks/use-update-cooperative";
import { useAuthStore } from "@/store/auth.store";

export function CoopCurrencyForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const { data: profile } = useProfile(coopId);
  const updateCooperative = useUpdateCooperative(coopId ?? "");

  if (isLoading || !coop || !profile) {
    return (
      <Card>
        <CardContent>
          <div className="h-16 animate-pulse rounded-lg bg-muted" />
        </CardContent>
      </Card>
    );
  }

  const handleChange = async (currency: string) => {
    if (currency === coop.currency) return;
    try {
      await updateCooperative.mutateAsync({
        name: coop.name,
        adminFirstName: profile.firstName,
        adminLastName: profile.lastName,
        contactEmail: coop.contactEmail,
        contactPhone: coop.contactPhone,
        address: coop.address,
        country: coop.country,
        state: coop.state,
        city: coop.city,
        currency,
      });
      toast.success("Currency updated", {
        description: `Your members now see amounts recorded in ${currency}.`,
      });
    } catch (error) {
      toast.error("Couldn't update currency", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
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
            disabled={updateCooperative.isPending}
          />

          <div className="flex items-center gap-2">
            {updateCooperative.isPending ? (
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
