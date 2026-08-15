"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useIntegrationSettings,
  useUpdateIntegrationSettings,
} from "@/hooks/use-integration-settings";
import {
  integrationsSchema,
  type IntegrationsFormValues,
} from "@/lib/validations/settings.schema";

export function SettingsIntegrationsTab() {
  const {
    data: integrations,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useIntegrationSettings();

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isFetching}
      errorTitle="Couldn't load integrations"
    >
      {integrations ? (
        <SettingsIntegrationsForm integrations={integrations} />
      ) : null}
    </QueryBoundary>
  );
}

function SettingsIntegrationsForm({
  integrations,
}: {
  integrations: IntegrationsFormValues;
}) {
  const updateIntegrations = useUpdateIntegrationSettings();

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
  const flutterwaveEnabled = watch("flutterwaveEnabled");

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateIntegrations.mutateAsync({
        paystackEnabled: values.paystackEnabled,
        paystackPublicKey: values.paystackPublicKey ?? "",
        paystackSecretKey: values.paystackSecretKey ?? "",
        paystackWebhookSecret: values.paystackWebhookSecret ?? "",
        flutterwaveEnabled: values.flutterwaveEnabled,
        flutterwavePublicKey: values.flutterwavePublicKey ?? "",
        flutterwaveSecretKey: values.flutterwaveSecretKey ?? "",
        flutterwaveEncryptionKey: values.flutterwaveEncryptionKey ?? "",
      });
      reset(values);
      toast.success("Integrations saved");
    } catch (error) {
      toast.error("Couldn't save integrations", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const saving = updateIntegrations.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">
          Third party Integrations
        </p>
        <p className="text-xs text-muted-foreground">
          Enable either gateway, or both — members will be able to pay with
          whichever ones are turned on.
        </p>
      </div>

      <div className="max-w-xl space-y-4">
        <GatewayCard
          name="Paystack"
          description="Setup your paystack credentials"
          enabled={paystackEnabled}
          control={control}
          enabledField="paystackEnabled"
          disabled={saving}
          fields={[
            {
              label: "Public Key",
              registration: register("paystackPublicKey"),
            },
            {
              label: "Secret Key",
              type: "password",
              registration: register("paystackSecretKey"),
            },
            {
              label: "Webhook secret",
              type: "password",
              registration: register("paystackWebhookSecret"),
            },
          ]}
          caveat={
            <>
              These are stored for reference only — the live integration still
              reads its keys from the server environment (
              <code>PAYSTACK_SECRET_KEY</code>), never from values saved here.
            </>
          }
        />

        <GatewayCard
          name="Flutterwave"
          description="Setup your flutterwave credentials"
          enabled={flutterwaveEnabled}
          control={control}
          enabledField="flutterwaveEnabled"
          disabled={saving}
          fields={[
            {
              label: "Public Key",
              registration: register("flutterwavePublicKey"),
            },
            {
              label: "Secret Key",
              type: "password",
              registration: register("flutterwaveSecretKey"),
            },
            {
              label: "Encryption Key",
              type: "password",
              registration: register("flutterwaveEncryptionKey"),
            },
          ]}
          caveat={
            <>
              These are stored for reference only — unlike Paystack, there is no
              live Flutterwave route handler behind this yet, so enabling it
              here does not change how payments are actually processed.
            </>
          }
        />
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

interface GatewayField {
  label: string;
  type?: string;
  registration: UseFormRegisterReturn;
}

interface GatewayCardProps {
  name: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  control: ReturnType<typeof useForm<IntegrationsFormValues>>["control"];
  enabledField: "paystackEnabled" | "flutterwaveEnabled";
  fields: GatewayField[];
  caveat: React.ReactNode;
}

function GatewayCard({
  name,
  description,
  enabled,
  disabled,
  control,
  enabledField,
  fields,
  caveat,
}: GatewayCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm font-medium text-foreground">{name}</p>
            <p className="text-xs text-muted-foreground">{description}</p>
          </div>
          <Controller
            control={control}
            name={enabledField}
            render={({ field }) => (
              <Switch
                checked={field.value}
                onCheckedChange={field.onChange}
                disabled={disabled}
              />
            )}
          />
        </div>

        {enabled ? (
          <div className="space-y-3">
            {fields.map((field) => (
              <GatewayField key={field.label} {...field} disabled={disabled} />
            ))}
            <p className="text-xs text-muted-foreground">{caveat}</p>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GatewayField({
  label,
  type = "text",
  disabled,
  registration,
}: GatewayField & { disabled: boolean }) {
  const id = useId();
  const InputComponent = type === "password" ? PasswordInput : Input;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <InputComponent
        id={id}
        placeholder={label}
        disabled={disabled}
        className="h-11"
        {...registration}
      />
    </div>
  );
}
