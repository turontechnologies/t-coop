"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CooperativeLogoUploader } from "@/components/features/admin-settings/cooperative-logo-uploader";
import { LocationFields } from "@/components/features/shared/location-fields";
import { useCooperative } from "@/hooks/use-cooperative";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateCooperative } from "@/hooks/use-update-cooperative";
import {
  ID_GENERATION_TYPE_OPTIONS,
  previewGeneratedId,
} from "@/lib/id-format-preview";
import {
  editCooperativeSchema,
  type EditCooperativeFormValues,
} from "@/lib/validations/coop.schema";
import { useAuthStore } from "@/store/auth.store";

export function CooperativeDetailsForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;
  const { data: coop, isLoading } = useCooperative(coopId);
  const { data: profile } = useProfile(coopId);
  const updateCooperative = useUpdateCooperative(coopId ?? "");

  const nameId = useId();
  const addressId = useId();
  const emailId = useId();
  const phoneId = useId();
  const ninId = useId();
  const memberIdPrefixId = useId();
  const memberIdPaddingId = useId();
  const memberIdTypeId = useId();
  const minGuarantorsId = useId();

  const {
    control,
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isDirty },
  } = useForm<EditCooperativeFormValues>({
    resolver: zodResolver(editCooperativeSchema),
  });

  useEffect(() => {
    if (!coop || !profile) return;
    reset({
      name: coop.name,
      adminFirstName: profile.firstName,
      adminLastName: profile.lastName,
      adminNin: profile.nin ?? "",
      contactEmail: coop.contactEmail,
      contactPhone: coop.contactPhone,
      address: coop.address,
      country: coop.country,
      state: coop.state,
      city: coop.city,
      currency: coop.currency,
      withdrawalFeeAmount: coop.withdrawalFeeAmount,
      withdrawalFeeType: coop.withdrawalFeeType,
      memberIdPrefix: coop.memberIdPrefix,
      memberIdPadding: coop.memberIdPadding,
      memberIdType: coop.memberIdType,
      minGuarantors: coop.minGuarantors,
    });
  }, [coop, profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateCooperative.mutateAsync(values);
      reset(values);
      toast.success("Co-operative details saved");
    } catch (error) {
      toast.error("Couldn't save changes", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = updateCooperative.isPending;

  if (isLoading || !coop || !profile) {
    return <div className="h-64 animate-pulse rounded-xl bg-muted" />;
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Branding</p>
          <p className="text-xs text-muted-foreground">
            What members see confirming which co-operative they belong to.
          </p>
        </div>
        <CooperativeLogoUploader
          coopId={coopId as string}
          logoUrl={coop.logoUrl}
          name={coop.name}
        />
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Co-operative Details
          </p>
          <p className="text-xs text-muted-foreground">
            Update your co-operative details
          </p>
        </div>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor={nameId}>Co-operative name</Label>
            <Input
              id={nameId}
              placeholder="Enter co-op name"
              disabled={busy}
              aria-invalid={!!errors.name}
              className="h-11"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={addressId}>Co-operative address</Label>
            <Input
              id={addressId}
              placeholder="Enter address"
              disabled={busy}
              aria-invalid={!!errors.address}
              className="h-11"
              {...register("address")}
            />
            <FieldError message={errors.address?.message} />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={emailId}>Contact Email</Label>
              <Input
                id={emailId}
                type="email"
                placeholder="Enter email"
                disabled={busy}
                aria-invalid={!!errors.contactEmail}
                className="h-11"
                {...register("contactEmail")}
              />
              <FieldError message={errors.contactEmail?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={phoneId}>Contact Phone no</Label>
              <Input
                id={phoneId}
                placeholder="Enter phone no"
                disabled={busy}
                aria-invalid={!!errors.contactPhone}
                className="h-11"
                {...register("contactPhone")}
              />
              <FieldError message={errors.contactPhone?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={ninId}>Contact Person&apos;s NIN</Label>
              <Input
                id={ninId}
                placeholder="Enter NIN"
                disabled={busy}
                aria-invalid={!!errors.adminNin}
                className="h-11"
                {...register("adminNin")}
              />
              <FieldError message={errors.adminNin?.message} />
            </div>
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LocationFields
              country={watch("country")}
              state={watch("state")}
              city={watch("city")}
              onCountryChange={(value) =>
                setValue("country", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onStateChange={(value) =>
                setValue("state", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              onCityChange={(value) =>
                setValue("city", value, {
                  shouldDirty: true,
                  shouldValidate: true,
                })
              }
              disabled={busy}
              countryError={errors.country?.message}
              stateError={errors.state?.message}
              cityError={errors.city?.message}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Member ID Format
          </p>
          <p className="text-xs text-muted-foreground">
            How Members Directory auto-generates the next membership ID for this
            co-op — new members get an ID automatically.
          </p>
        </div>
        <div className="flex flex-wrap items-start gap-3">
          <div className="space-y-2">
            <Label htmlFor={memberIdPrefixId}>Prefix</Label>
            <Input
              id={memberIdPrefixId}
              placeholder="MB"
              disabled={busy}
              aria-invalid={!!errors.memberIdPrefix}
              className="h-11 w-32"
              {...register("memberIdPrefix")}
            />
            <FieldError message={errors.memberIdPrefix?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={memberIdTypeId}>Character Type</Label>
            <Controller
              control={control}
              name="memberIdType"
              render={({ field }) => (
                <Select
                  value={field.value ?? "NUMERIC"}
                  onValueChange={(value) => field.onChange(value ?? "NUMERIC")}
                  disabled={busy}
                >
                  <SelectTrigger id={memberIdTypeId} className="h-11 w-56">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ID_GENERATION_TYPE_OPTIONS.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={memberIdPaddingId}>Length</Label>
            <Input
              id={memberIdPaddingId}
              type="number"
              disabled={busy}
              aria-invalid={!!errors.memberIdPadding}
              className="h-11 w-24"
              {...register("memberIdPadding", { valueAsNumber: true })}
            />
            <FieldError message={errors.memberIdPadding?.message} />
          </div>
          <div className="space-y-2">
            <Label>Next ID would look like</Label>
            <p className="flex h-11 items-center text-sm font-medium text-foreground">
              {previewGeneratedId(
                watch("memberIdPrefix") || "MB",
                watch("memberIdType") || "NUMERIC",
                watch("memberIdPadding") || 4,
              )}
            </p>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Membership Rules
          </p>
          <p className="text-xs text-muted-foreground">
            How many guarantors a new member needs — at least one always has to
            be an existing member of this co-op, the rest can be anyone.
          </p>
        </div>
        <div className="space-y-2">
          <Label htmlFor={minGuarantorsId}>Minimum Guarantors</Label>
          <Input
            id={minGuarantorsId}
            type="number"
            disabled={busy}
            aria-invalid={!!errors.minGuarantors}
            className="h-11 w-24"
            {...register("minGuarantors", { valueAsNumber: true })}
          />
          <FieldError message={errors.minGuarantors?.message} />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() =>
            reset({
              name: coop.name,
              adminFirstName: profile.firstName,
              adminLastName: profile.lastName,
              adminNin: profile.nin ?? "",
              contactEmail: coop.contactEmail,
              contactPhone: coop.contactPhone,
              address: coop.address,
              country: coop.country,
              state: coop.state,
              city: coop.city,
              currency: coop.currency,
              withdrawalFeeAmount: coop.withdrawalFeeAmount,
              withdrawalFeeType: coop.withdrawalFeeType,
              memberIdPrefix: coop.memberIdPrefix,
              memberIdPadding: coop.memberIdPadding,
              memberIdType: coop.memberIdType,
              minGuarantors: coop.minGuarantors,
            })
          }
          disabled={busy}
        >
          Reset
        </Button>
        <Button type="submit" disabled={busy || !isDirty}>
          {busy ? (
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

function FieldError({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <p className="flex items-center gap-1.5 text-sm text-destructive">
      <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
      {message}
    </p>
  );
}
