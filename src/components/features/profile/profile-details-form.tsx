"use client";

import { useId, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm, type UseFormRegisterReturn } from "react-hook-form";
import { motion } from "framer-motion";
import { BadgeCheck, ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { COUNTRIES } from "@/lib/countries";
import type { ProfileRecord } from "@/lib/profile-data";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile.schema";
import { cn } from "@/lib/utils";

interface ProfileDetailsFormProps {
  memberId: string;
  profile: ProfileRecord;
}

export function ProfileDetailsForm({
  memberId,
  profile,
}: ProfileDetailsFormProps) {
  const membershipIdFieldId = useId();
  const updateProfile = useUpdateProfile();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: profile,
  });

  const onSubmit = handleSubmit(async (values) => {
    updateProfile.reset();
    try {
      await updateProfile.mutateAsync({ memberId, values });
      reset(values);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Couldn't update your profile", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  });

  const handleCancel = () => {
    reset(profile);
    toast.info("Changes discarded");
  };

  const busy = isSubmitting || updateProfile.isPending;

  return (
    <motion.form
      onSubmit={onSubmit}
      noValidate
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField
            label="Bank Verification Number (BVN)"
            required
            registration={register("bvn")}
            error={errors.bvn?.message}
            disabled
            trailing={
              <span className="flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                Verified
              </span>
            }
          />
          <ProfileField
            label="First Name"
            required
            registration={register("firstName")}
            error={errors.firstName?.message}
            disabled={busy}
          />
          <ProfileField
            label="Last Name"
            required
            registration={register("lastName")}
            error={errors.lastName?.message}
            disabled={busy}
          />
          <ProfileField
            label="Other Name"
            registration={register("otherName")}
            error={errors.otherName?.message}
            disabled={busy}
          />
          <ProfileSelect
            label="Gender"
            registration={register("gender")}
            error={errors.gender?.message}
            disabled={busy}
            options={["Male", "Female", "Other"]}
          />
          <ProfileField
            label="Phone"
            required
            registration={register("phone")}
            error={errors.phone?.message}
            disabled={busy}
          />
          <ProfileField
            label="Email"
            required
            type="email"
            registration={register("email")}
            error={errors.email?.message}
            disabled={busy}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField
            label="Home Address"
            required
            registration={register("homeAddress")}
            error={errors.homeAddress?.message}
            disabled={busy}
          />
          <ProfileSelect
            label="Country"
            registration={register("country")}
            error={errors.country?.message}
            disabled={busy}
            options={COUNTRIES}
          />
          <ProfileField
            label="State"
            registration={register("state")}
            error={errors.state?.message}
            disabled={busy}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileField
            label="Facebook"
            placeholder="N/A"
            registration={register("facebook")}
            error={errors.facebook?.message}
            disabled={busy}
          />
          <ProfileField
            label="Twitter"
            placeholder="N/A"
            registration={register("twitter")}
            error={errors.twitter?.message}
            disabled={busy}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={membershipIdFieldId}>Membership ID</Label>
            <Input
              id={membershipIdFieldId}
              value={memberId}
              disabled
              className="h-11"
            />
          </div>
          <ProfileField
            label="Guarantor"
            registration={register("guarantor")}
            error={errors.guarantor?.message}
            disabled={busy}
          />
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button
          type="button"
          variant="ghost"
          onClick={handleCancel}
          disabled={busy || !isDirty}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={busy || !isDirty} className="sm:w-40">
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Saving…
            </>
          ) : (
            "Update Details"
          )}
        </Button>
      </div>
    </motion.form>
  );
}

interface ProfileFieldProps {
  label: string;
  required?: boolean;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  registration: UseFormRegisterReturn;
  trailing?: ReactNode;
}

function ProfileField({
  label,
  required,
  type = "text",
  placeholder,
  disabled,
  error,
  registration,
  trailing,
}: ProfileFieldProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <Label htmlFor={id}>
          {label}
          {required ? <span className="ml-0.5 text-destructive">*</span> : null}
        </Label>
        {trailing}
      </div>
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

interface ProfileSelectProps {
  label: string;
  required?: boolean;
  disabled?: boolean;
  error?: string;
  options: readonly string[];
  registration: UseFormRegisterReturn;
}

function ProfileSelect({
  label,
  required,
  disabled,
  error,
  options,
  registration,
}: ProfileSelectProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <div className="relative">
        <select
          id={id}
          disabled={disabled}
          aria-invalid={!!error}
          className={cn(
            "h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30",
          )}
          {...registration}
        >
          {options.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
        <ChevronDown
          className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
      </div>
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
