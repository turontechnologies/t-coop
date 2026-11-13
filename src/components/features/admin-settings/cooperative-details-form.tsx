"use client";

import { useEffect, useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
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
import { cn } from "@/lib/utils";
import type { CooperativeSummary } from "@/types/cooperative";
import { useAuthStore } from "@/store/auth.store";

/** The form's values from what's saved — used to load the form and to reset it. */
function formValuesOf(
  coop: CooperativeSummary,
  profile: { firstName: string; lastName: string; nin?: string | null },
): EditCooperativeFormValues {
  return {
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
    requireMemberGuarantors: !!coop.requireMemberGuarantors,
    minGuarantors: Math.max(1, coop.minGuarantors || 1),
    memberGuarantorSource: coop.memberGuarantorSource ?? "Any",
    memberGuarantorsFromCoop: coop.memberGuarantorsFromCoop ?? 0,
    memberGuarantorsFromOutside: coop.memberGuarantorsFromOutside ?? 0,
    alternativeIdLabel:
      coop.alternativeIdLabel && coop.alternativeIdLabel !== "Alternative ID"
        ? coop.alternativeIdLabel
        : "",
  };
}

const GUARANTOR_SOURCES = [
  {
    value: "Any",
    title: "Anyone",
    hint: "Members of the co-operative or people outside it.",
  },
  {
    value: "CoopOnly",
    title: "Co-op members only",
    hint: "Every guarantor must be a member of this co-operative.",
  },
  {
    value: "Mix",
    title: "A set mix",
    hint: "Choose how many must come from the co-operative and from outside.",
  },
] as const;

export function CooperativeDetailsForm() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.cooperativeId ?? member?.id;
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
  const requireGuarantorId = useId();
  const minGuarantorsId = useId();
  const fromCoopId = useId();
  const fromOutsideId = useId();
  const altLabelId = useId();

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
    reset(formValuesOf(coop, profile));
  }, [coop, profile, reset]);

  const onSubmit = handleSubmit(async (values) => {
    try {
      // With guarantors off, the where-from rules aren't in play, so leave them as saved.
      await updateCooperative.mutateAsync(
        values.requireMemberGuarantors
          ? values
          : {
              ...values,
              memberGuarantorSource: undefined,
              memberGuarantorsFromCoop: undefined,
              memberGuarantorsFromOutside: undefined,
            },
      );
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
  const requireGuarantors = watch("requireMemberGuarantors");
  const guarantorSource = watch("memberGuarantorSource") ?? "Any";
  const minGuarantors = watch("minGuarantors") || 1;
  const fromCoopCount = watch("memberGuarantorsFromCoop") || 0;
  const fromOutsideCount = watch("memberGuarantorsFromOutside") || 0;
  const freeGuarantors = Math.max(
    0,
    minGuarantors - fromCoopCount - fromOutsideCount,
  );

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
          <p className="text-sm font-medium text-foreground">Alternative ID</p>
          <p className="text-xs text-muted-foreground">
            A second ID members can have, such as a staff number. Choose what
            it&apos;s called. The name shows on tables and forms.
          </p>
        </div>
        <div className="space-y-2 sm:max-w-sm">
          <Label htmlFor={altLabelId}>Call it</Label>
          <Input
            id={altLabelId}
            placeholder="Alternative ID"
            maxLength={40}
            disabled={busy}
            aria-invalid={!!errors.alternativeIdLabel}
            className="h-11"
            {...register("alternativeIdLabel")}
          />
          <p className="text-xs text-muted-foreground">
            e.g. Staff No., Old Register No., IPPIS No. Leave it empty for
            &ldquo;Alternative ID&rdquo;.
          </p>
          <FieldError message={errors.alternativeIdLabel?.message} />
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">New members</p>
          <p className="text-xs text-muted-foreground">
            Whether adding a member needs guarantors, how many, and where they
            can come from. Loan guarantors are set in Settings → Loans.
          </p>
        </div>
        <div className="space-y-4 sm:max-w-xl">
          <Controller
            control={control}
            name="requireMemberGuarantors"
            render={({ field }) => (
              <div className="flex items-start justify-between gap-4 rounded-xl border border-border p-4">
                <div className="space-y-0.5">
                  <Label htmlFor={requireGuarantorId}>
                    Require guarantors when adding a member
                  </Label>
                  <p className="text-xs text-muted-foreground">
                    {field.value
                      ? "Add Member won't save until the rules below are met."
                      : "Guarantors are optional on Add Member."}
                  </p>
                </div>
                <Switch
                  id={requireGuarantorId}
                  checked={!!field.value}
                  onCheckedChange={(checked) => field.onChange(checked)}
                  disabled={busy}
                />
              </div>
            )}
          />

          {requireGuarantors ? (
            <div className="space-y-5 rounded-xl border border-border p-4">
              <div className="space-y-2">
                <Label htmlFor={minGuarantorsId}>
                  Minimum number of guarantors
                </Label>
                <Input
                  id={minGuarantorsId}
                  type="number"
                  min={1}
                  max={10}
                  disabled={busy}
                  aria-invalid={!!errors.minGuarantors}
                  className="h-11 w-28"
                  {...register("minGuarantors", { valueAsNumber: true })}
                />
                <FieldError message={errors.minGuarantors?.message} />
              </div>

              <fieldset className="space-y-2">
                <legend className="mb-2 text-sm font-medium text-foreground">
                  Where can guarantors come from?
                </legend>
                <Controller
                  control={control}
                  name="memberGuarantorSource"
                  render={({ field }) => (
                    <div
                      role="radiogroup"
                      className="grid grid-cols-1 gap-2 sm:grid-cols-3"
                    >
                      {GUARANTOR_SOURCES.map((option) => {
                        const selected =
                          (field.value ?? "Any") === option.value;
                        return (
                          <button
                            key={option.value}
                            type="button"
                            role="radio"
                            aria-checked={selected}
                            disabled={busy}
                            onClick={() => field.onChange(option.value)}
                            className={cn(
                              "space-y-1 rounded-lg border p-3 text-left transition-colors disabled:opacity-50",
                              selected
                                ? "border-primary bg-primary/5 ring-1 ring-primary"
                                : "border-border hover:bg-muted/50",
                            )}
                          >
                            <span className="block text-sm font-medium text-foreground">
                              {option.title}
                            </span>
                            <span className="block text-xs text-muted-foreground">
                              {option.hint}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  )}
                />
              </fieldset>

              {guarantorSource === "Mix" ? (
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                    <div className="space-y-2">
                      <Label htmlFor={fromCoopId}>
                        At least this many from the co-operative
                      </Label>
                      <Input
                        id={fromCoopId}
                        type="number"
                        min={0}
                        max={10}
                        disabled={busy}
                        aria-invalid={!!errors.memberGuarantorsFromCoop}
                        className="h-11 w-28"
                        {...register("memberGuarantorsFromCoop", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor={fromOutsideId}>
                        At least this many from outside
                      </Label>
                      <Input
                        id={fromOutsideId}
                        type="number"
                        min={0}
                        max={10}
                        disabled={busy}
                        aria-invalid={!!errors.memberGuarantorsFromOutside}
                        className="h-11 w-28"
                        {...register("memberGuarantorsFromOutside", {
                          valueAsNumber: true,
                        })}
                      />
                    </div>
                  </div>
                  <FieldError
                    message={
                      errors.memberGuarantorsFromCoop?.message ??
                      errors.memberGuarantorsFromOutside?.message
                    }
                  />
                  <p className="text-xs text-muted-foreground">
                    Every new member needs {minGuarantors} guarantor
                    {minGuarantors === 1 ? "" : "s"}: at least {fromCoopCount}{" "}
                    from the co-operative and {fromOutsideCount} from outside
                    {freeGuarantors > 0
                      ? `; the other ${freeGuarantors} can be anyone`
                      : ""}
                    .
                  </p>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(formValuesOf(coop, profile))}
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
