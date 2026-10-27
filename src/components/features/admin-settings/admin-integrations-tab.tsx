"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldError,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { Switch } from "@/components/ui/switch";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  useCoopIntegrations,
  useUpdateCoopIntegrations,
} from "@/hooks/use-coop-integrations";
import {
  coopIntegrationsSchema,
  type CoopIntegrationsFormValues,
} from "@/lib/validations/admin-settings.schema";
import type { CoopIntegrations } from "@/services/coop-integrations.service";
import { useAuthStore } from "@/store/auth.store";

/** The co-op's own payment gateways — when one is on, members' savings deposits and loan
 * repayments are paid straight into the co-op's own Paystack/Flutterwave account instead of the
 * platform's (see the backend's CoopGatewayResolver). */
export function AdminIntegrationsTab({ readOnly }: { readOnly: boolean }) {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.cooperativeId ?? member?.id;
  const { data, isLoading, isError, error, refetch, isFetching } =
    useCoopIntegrations(coopId);

  return (
    <QueryBoundary
      isLoading={isLoading}
      isError={isError}
      error={error}
      onRetry={() => refetch()}
      isRetrying={isFetching}
      errorTitle="Couldn't load integrations"
    >
      {data && coopId ? (
        <AdminIntegrationsForm
          coopId={coopId}
          integrations={data}
          readOnly={readOnly}
        />
      ) : null}
    </QueryBoundary>
  );
}

function toFormValues(
  integrations: CoopIntegrations,
): CoopIntegrationsFormValues {
  return {
    paystackEnabled: integrations.paystackEnabled,
    paystackPublicKey: integrations.paystackPublicKey,
    paystackSecretKey: "",
    paystackSecretKeySet: integrations.paystackSecretKeySet,
    flutterwaveEnabled: integrations.flutterwaveEnabled,
    flutterwavePublicKey: integrations.flutterwavePublicKey,
    flutterwaveSecretKey: "",
    flutterwaveSecretKeySet: integrations.flutterwaveSecretKeySet,
  };
}

function AdminIntegrationsForm({
  coopId,
  integrations,
  readOnly,
}: {
  coopId: string;
  integrations: CoopIntegrations;
  readOnly: boolean;
}) {
  const updateIntegrations = useUpdateCoopIntegrations(coopId);

  const {
    control,
    register,
    handleSubmit,
    reset,
    watch,
    formState: { errors, isDirty },
  } = useForm<CoopIntegrationsFormValues>({
    resolver: zodResolver(coopIntegrationsSchema),
    defaultValues: toFormValues(integrations),
  });

  const paystackEnabled = watch("paystackEnabled");
  const flutterwaveEnabled = watch("flutterwaveEnabled");

  const onSubmit = handleSubmit(async (values) => {
    try {
      const saved = await updateIntegrations.mutateAsync({
        paystackEnabled: values.paystackEnabled,
        paystackPublicKey: values.paystackPublicKey,
        paystackSecretKey: values.paystackSecretKey,
        flutterwaveEnabled: values.flutterwaveEnabled,
        flutterwavePublicKey: values.flutterwavePublicKey,
        flutterwaveSecretKey: values.flutterwaveSecretKey,
      });
      reset(toFormValues(saved));
      toast.success("Integrations saved");
    } catch (error) {
      toast.error("Couldn't save integrations", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const saving = updateIntegrations.isPending;
  const disabled = saving || readOnly;
  const activeGateway = integrations.paystackEnabled
    ? "Paystack"
    : integrations.flutterwaveEnabled
      ? "Flutterwave"
      : null;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="space-y-1">
        <p className="text-sm font-medium text-foreground">Payment gateways</p>
        <p className="text-xs text-muted-foreground">
          Connect your co-operative&apos;s own Paystack or Flutterwave account
          so members&apos; savings deposits and loan repayments are paid
          straight into it. If both are on, Paystack is used.
        </p>
      </div>

      <div className="max-w-xl rounded-lg border border-border bg-muted/40 px-4 py-3 text-xs text-muted-foreground">
        {activeGateway ? (
          <span className="flex items-center gap-2">
            <CheckCircle2
              className="size-4 shrink-0 text-emerald-600"
              aria-hidden="true"
            />
            Members are currently paying through your own {activeGateway}{" "}
            account.
          </span>
        ) : (
          "No gateway of your own is on yet — members' online payments go through the platform's Paystack account."
        )}
      </div>

      <div className="max-w-xl space-y-4">
        <GatewayCard
          name="Paystack"
          description="Your Paystack API keys, from Settings → API Keys & Webhooks on your Paystack dashboard"
          enabled={paystackEnabled}
          control={control}
          enabledField="paystackEnabled"
          disabled={disabled}
          fields={[
            {
              label: "Public Key",
              placeholder: "pk_live_…",
              registration: register("paystackPublicKey"),
              error: errors.paystackPublicKey,
            },
            {
              label: "Secret Key",
              type: "password",
              placeholder: integrations.paystackSecretKeySet
                ? "Saved — leave blank to keep it"
                : "sk_live_…",
              registration: register("paystackSecretKey"),
              error: errors.paystackSecretKey,
            },
          ]}
        />

        <GatewayCard
          name="Flutterwave"
          description="Your Flutterwave API keys, from Settings → API Keys on your Flutterwave dashboard"
          enabled={flutterwaveEnabled}
          control={control}
          enabledField="flutterwaveEnabled"
          disabled={disabled}
          fields={[
            {
              label: "Public Key",
              placeholder: "FLWPUBK-…",
              registration: register("flutterwavePublicKey"),
              error: errors.flutterwavePublicKey,
            },
            {
              label: "Secret Key",
              type: "password",
              placeholder: integrations.flutterwaveSecretKeySet
                ? "Saved — leave blank to keep it"
                : "FLWSECK-…",
              registration: register("flutterwaveSecretKey"),
              error: errors.flutterwaveSecretKey,
            },
          ]}
        />
      </div>

      {readOnly ? (
        <p className="text-xs text-muted-foreground">
          You have view-only access to integrations.
        </p>
      ) : (
        <div className="flex justify-end gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={() => reset(toFormValues(integrations))}
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
      )}
    </form>
  );
}

interface GatewayFieldProps {
  label: string;
  type?: string;
  placeholder: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

interface GatewayCardProps {
  name: string;
  description: string;
  enabled: boolean;
  disabled: boolean;
  control: Control<CoopIntegrationsFormValues>;
  enabledField: "paystackEnabled" | "flutterwaveEnabled";
  fields: GatewayFieldProps[];
}

function GatewayCard({
  name,
  description,
  enabled,
  disabled,
  control,
  enabledField,
  fields,
}: GatewayCardProps) {
  return (
    <Card>
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between gap-4">
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
                aria-label={`Use ${name}`}
              />
            )}
          />
        </div>

        {enabled ? (
          <div className="space-y-3">
            {fields.map((field) => (
              <GatewayField key={field.label} {...field} disabled={disabled} />
            ))}
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}

function GatewayField({
  label,
  type = "text",
  placeholder,
  disabled,
  registration,
  error,
}: GatewayFieldProps & { disabled: boolean }) {
  const id = useId();
  const InputComponent = type === "password" ? PasswordInput : Input;
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <InputComponent
        id={id}
        placeholder={placeholder}
        disabled={disabled}
        autoComplete="off"
        aria-invalid={!!error}
        className="h-11"
        {...registration}
      />
      {error ? (
        <p className="text-xs text-destructive">{error.message}</p>
      ) : null}
    </div>
  );
}
