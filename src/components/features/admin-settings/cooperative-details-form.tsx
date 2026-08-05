"use client";

import { useId, useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  cooperativeSettingsSchema,
  type CooperativeSettingsFormValues,
} from "@/lib/validations/admin-settings.schema";
import { useAdminSettingsStore } from "@/store/admin-settings.store";

export function CooperativeDetailsForm() {
  const cooperativeSettings = useAdminSettingsStore(
    (state) => state.cooperativeSettings,
  );
  const updateCooperativeSettings = useAdminSettingsStore(
    (state) => state.updateCooperativeSettings,
  );
  const [saving, setSaving] = useState(false);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isDirty },
  } = useForm<CooperativeSettingsFormValues>({
    resolver: zodResolver(cooperativeSettingsSchema),
    defaultValues: cooperativeSettings,
  });

  const onSubmit = handleSubmit(async (values) => {
    setSaving(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    updateCooperativeSettings({ ...values, website: values.website ?? "" });
    setSaving(false);
    reset(values);
    toast.success("Co-operative details saved");
  });

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
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
          <Field
            label="Co-operative name"
            placeholder="Enter co-op name"
            error={errors.name?.message}
            disabled={saving}
            registration={register("name")}
          />
          <Field
            label="Co-operative address"
            placeholder="Enter address"
            error={errors.address?.message}
            disabled={saving}
            registration={register("address")}
          />
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Contact Person"
              placeholder="Enter name"
              error={errors.contactPerson?.message}
              disabled={saving}
              registration={register("contactPerson")}
            />
            <Field
              label="Website"
              placeholder="Enter website"
              error={errors.website?.message}
              disabled={saving}
              registration={register("website")}
            />
          </div>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Field
              label="Contact Email"
              type="email"
              placeholder="Enter email"
              error={errors.contactEmail?.message}
              disabled={saving}
              registration={register("contactEmail")}
            />
            <Field
              label="Contact Phone no"
              placeholder="Enter phone no"
              error={errors.contactPhone?.message}
              disabled={saving}
              registration={register("contactPhone")}
            />
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[220px_1fr]">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">
            Committee Members
          </p>
          <p className="text-xs text-muted-foreground">
            Update co-operative committee members details
          </p>
        </div>
        <div className="space-y-4">
          <Field
            label="President Name"
            placeholder="Enter Name"
            error={errors.presidentName?.message}
            disabled={saving}
            registration={register("presidentName")}
          />
          <Field
            label="Contact Information"
            placeholder="Enter contact"
            error={errors.presidentContact?.message}
            disabled={saving}
            registration={register("presidentContact")}
          />

          <div className="h-px bg-border" />

          <Field
            label="Chairman Name"
            placeholder="Enter Name"
            error={errors.chairmanName?.message}
            disabled={saving}
            registration={register("chairmanName")}
          />
          <Field
            label="Contact Information"
            placeholder="Enter contact"
            error={errors.chairmanContact?.message}
            disabled={saving}
            registration={register("chairmanContact")}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={() => reset(cooperativeSettings)}
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

interface FieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  registration: ReturnType<
    ReturnType<typeof useForm<CooperativeSettingsFormValues>>["register"]
  >;
}

function Field({
  label,
  type = "text",
  placeholder,
  disabled,
  error,
  registration,
}: FieldProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type={type}
        placeholder={placeholder}
        disabled={disabled}
        aria-invalid={!!error}
        className="h-11"
        {...registration}
      />
      <FieldError message={error} />
    </div>
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
