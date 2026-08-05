"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  integrationsSchema,
  type IntegrationsFormValues,
} from "@/lib/validations/settings.schema";
import { useSettingsStore } from "@/store/settings.store";

export function SettingsIntegrationsTab() {
  const integrations = useSettingsStore((state) => state.integrations);
  const updateIntegrations = useSettingsStore(
    (state) => state.updateIntegrations,
  );
  const [saving, setSaving] = useState(false);
  const publicKeyId = useId();
  const secretKeyId = useId();
  const webhookId = useId();

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { isDirty },
  } = useForm<IntegrationsFormValues>({
    resolver: zodResolver(integrationsSchema),
    defaultValues: integrations,
  });

  const paystackEnabled = watch("paystackEnabled");

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    updateIntegrations({
      paystackEnabled: values.paystackEnabled,
      paystackPublicKey: values.paystackPublicKey ?? "",
      paystackSecretKey: values.paystackSecretKey ?? "",
      paystackWebhookSecret: values.paystackWebhookSecret ?? "",
      flutterwaveEnabled: values.flutterwaveEnabled,
    });
    setSaving(false);
    reset(values);
    toast.success("Integrations saved");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Third party Integrations
        </p>
        <p className="text-xs text-muted-foreground">
          Set up your integrations by configuring your productions through your
          keys.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <Card>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Paystack</p>
                <p className="text-xs text-muted-foreground">
                  Setup your paystack credentials
                </p>
              </div>
              <Controller
                control={control}
                name="paystackEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled={saving}
                  />
                )}
              />
            </div>

            {paystackEnabled ? (
              <div className="space-y-3">
                <div className="space-y-2">
                  <Label htmlFor={publicKeyId}>Public Key</Label>
                  <Input
                    id={publicKeyId}
                    placeholder="Public Key"
                    disabled={saving}
                    className="h-11"
                    {...register("paystackPublicKey")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={secretKeyId}>Secret Key</Label>
                  <Input
                    id={secretKeyId}
                    type="password"
                    placeholder="Secret Key"
                    disabled={saving}
                    className="h-11"
                    {...register("paystackSecretKey")}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor={webhookId}>Webhook secret</Label>
                  <Input
                    id={webhookId}
                    type="password"
                    placeholder="Webhook secret"
                    disabled={saving}
                    className="h-11"
                    {...register("paystackWebhookSecret")}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  These are stored for reference only — the live integration
                  still reads its keys from the server environment (
                  <code>PAYSTACK_SECRET_KEY</code>), never from values saved
                  here.
                </p>
              </div>
            ) : null}
          </CardContent>
        </Card>

        <Card>
          <CardContent>
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">
                  Flutterwave
                </p>
                <p className="text-xs text-muted-foreground">
                  Not yet integrated in this app
                </p>
              </div>
              <Controller
                control={control}
                name="flutterwaveEnabled"
                render={({ field }) => (
                  <Switch
                    checked={field.value}
                    onCheckedChange={field.onChange}
                    disabled
                  />
                )}
              />
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(integrations)}
          disabled={saving}
        >
          Reset
        </Button>
        <Button type="submit" disabled={saving || !isDirty}>
          {saving ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Save Changes"
          )}
        </Button>
      </div>
    </form>
  );
}
