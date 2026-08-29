"use client";

import { useId } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CooperativeLogoUploader } from "@/components/features/admin-settings/cooperative-logo-uploader";
import { LocationFields } from "@/components/features/shared/location-fields";
import { useUpdateCooperative } from "@/hooks/use-update-cooperative";
import {
  editCooperativeSchema,
  type EditCooperativeFormValues,
} from "@/lib/validations/coop.schema";
import type { CooperativeSummary } from "@/types/cooperative";

interface EditCooperativeModalProps {
  coop: CooperativeSummary;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function EditCooperativeModal({
  coop,
  open,
  onOpenChange,
}: EditCooperativeModalProps) {
  const updateCooperative = useUpdateCooperative(coop.id);

  const nameId = useId();
  const adminFirstNameId = useId();
  const adminLastNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const addressId = useId();

  const [adminFirstName, ...adminLastNameParts] = coop.adminName
    .trim()
    .split(/\s+/);
  const adminLastName = adminLastNameParts.join(" ");

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<EditCooperativeFormValues>({
    resolver: zodResolver(editCooperativeSchema),
    defaultValues: {
      name: coop.name,
      adminFirstName: adminFirstName ?? "",
      adminLastName,
      contactEmail: coop.contactEmail,
      contactPhone: coop.contactPhone,
      address: coop.address,
      country: coop.country,
      state: coop.state,
      city: coop.city,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      await updateCooperative.mutateAsync(values);
      toast.success("Co-operative updated", {
        description: `${values.name}'s details were saved.`,
      });
      onOpenChange(false);
    } catch (error) {
      toast.error("Couldn't save changes", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = isSubmitting || updateCooperative.isPending;

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        if (!next) reset();
        onOpenChange(next);
      }}
    >
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle>Edit {coop.name}</DialogTitle>
        </DialogHeader>

        <form onSubmit={onSubmit} noValidate className="space-y-4">
          <CooperativeLogoUploader
            coopId={coop.id}
            logoUrl={coop.logoUrl}
            name={coop.name}
          />

          <div className="space-y-2">
            <Label htmlFor={nameId}>Co-operative Name</Label>
            <Input
              id={nameId}
              disabled={busy}
              aria-invalid={!!errors.name}
              className="h-11"
              {...register("name")}
            />
            <FieldError message={errors.name?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={adminFirstNameId}>Admin First Name</Label>
              <Input
                id={adminFirstNameId}
                disabled={busy}
                aria-invalid={!!errors.adminFirstName}
                className="h-11"
                {...register("adminFirstName")}
              />
              <FieldError message={errors.adminFirstName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={adminLastNameId}>Admin Last Name</Label>
              <Input
                id={adminLastNameId}
                disabled={busy}
                aria-invalid={!!errors.adminLastName}
                className="h-11"
                {...register("adminLastName")}
              />
              <FieldError message={errors.adminLastName?.message} />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor={emailId}>Contact Email</Label>
            <Input
              id={emailId}
              type="email"
              disabled={busy}
              aria-invalid={!!errors.contactEmail}
              className="h-11"
              {...register("contactEmail")}
            />
            <FieldError message={errors.contactEmail?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={phoneId}>Contact Phone No</Label>
            <Input
              id={phoneId}
              type="tel"
              disabled={busy}
              aria-invalid={!!errors.contactPhone}
              className="h-11"
              {...register("contactPhone")}
            />
            <FieldError message={errors.contactPhone?.message} />
          </div>

          <div className="space-y-2">
            <Label htmlFor={addressId}>Address</Label>
            <Input
              id={addressId}
              disabled={busy}
              aria-invalid={!!errors.address}
              className="h-11"
              {...register("address")}
            />
            <FieldError message={errors.address?.message} />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <LocationFields
              country={watch("country")}
              state={watch("state")}
              city={watch("city")}
              onCountryChange={(value) =>
                setValue("country", value, { shouldValidate: true })
              }
              onStateChange={(value) =>
                setValue("state", value, { shouldValidate: true })
              }
              onCityChange={(value) =>
                setValue("city", value, { shouldValidate: true })
              }
              disabled={busy}
              countryError={errors.country?.message}
              stateError={errors.state?.message}
              cityError={errors.city?.message}
            />
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => onOpenChange(false)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={busy} className="sm:w-32">
              {busy ? (
                <>
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                  Saving…
                </>
              ) : (
                "Save Changes"
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
