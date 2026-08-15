"use client";

import { useId, useRef, useState } from "react";
import Image from "next/image";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { Camera, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useCountries } from "@/hooks/use-countries";
import { useProfile } from "@/hooks/use-profile";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { logActivity } from "@/lib/audit-log";
import { getInitials } from "@/lib/format";
import {
  updateMockUserPassword,
  verifyMockUserPassword,
} from "@/lib/mock-users";
import type { ProfileRecord } from "@/lib/profile-data";
import {
  settingsProfileSchema,
  type SettingsProfileFormValues,
} from "@/lib/validations/settings.schema";
import { useAuthStore } from "@/store/auth.store";
import type { AuthenticatedMember } from "@/types/auth";

const ALLOWED_TYPES = new Set(["image/png", "image/jpeg", "image/webp"]);
const MAX_UPLOAD_BYTES = 5 * 1024 * 1024;

interface SettingsProfileTabProps {
  member: AuthenticatedMember;
}

export function SettingsProfileTab({ member }: SettingsProfileTabProps) {
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProfile(member.id);

  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-24 w-24 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError || !profile) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <TriangleAlert
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Couldn&apos;t load your profile
            </p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Please check your connection and try again."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isFetching}
          >
            {isFetching ? "Retrying…" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <SettingsProfileForm member={member} profile={profile} />;
}

interface SettingsProfileFormProps {
  member: AuthenticatedMember;
  profile: ProfileRecord;
}

function SettingsProfileForm({ member, profile }: SettingsProfileFormProps) {
  const setAvatarUrl = useAuthStore((state) => state.setAvatarUrl);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const updateProfile = useUpdateProfile();
  const { countries, loading: countriesLoading } = useCountries();

  const membershipIdFieldId = useId();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const {
    register,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isDirty },
  } = useForm<SettingsProfileFormValues>({
    resolver: zodResolver(settingsProfileSchema),
    defaultValues: {
      firstName: profile.firstName,
      lastName: profile.lastName,
      email: profile.email,
      address: profile.homeAddress,
      phone: profile.phone,
      country: profile.country,
    },
  });

  const country = watch("country");

  // Password fields are plain state (not part of the zod-resolved form)
  // since they're optional and only validated/submitted when filled.
  const [passwordFields, setPasswordFieldsState] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const passwordFieldsRef = useRef(passwordFields);
  passwordFieldsRef.current = passwordFields;
  const [passwordErrors, setPasswordErrors] = useState<
    Partial<
      Record<"currentPassword" | "newPassword" | "confirmPassword", string>
    >
  >({});

  const setPasswordError = (
    field: "currentPassword" | "newPassword" | "confirmPassword",
    message: string,
  ) => setPasswordErrors((prev) => ({ ...prev, [field]: message }));

  const clearPasswordFields = () => {
    setPasswordFieldsState({
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    });
    setPasswordErrors({});
  };

  const handleAvatarChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (!ALLOWED_TYPES.has(file.type)) {
      toast.error("Unsupported file type", {
        description: "Please choose a PNG, JPEG, or WEBP image.",
      });
      return;
    }
    if (file.size > MAX_UPLOAD_BYTES) {
      toast.error("Image too large", {
        description: "Please choose an image under 5MB.",
      });
      return;
    }

    setUploading(true);
    try {
      const formData = new FormData();
      formData.append("file", file);
      const response = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error ?? "Upload failed");
      setAvatarUrl(data.url);
      logActivity({
        module: "Settings",
        action: "Update",
        resource: "Profile photo",
      });
      toast.success("Profile photo updated");
    } catch (error) {
      toast.error("Couldn't upload photo", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploading(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    const passwordFields = passwordFieldsRef.current;
    const anyPasswordFilled =
      passwordFields.currentPassword ||
      passwordFields.newPassword ||
      passwordFields.confirmPassword;

    if (anyPasswordFilled) {
      if (!passwordFields.currentPassword) {
        setPasswordError("currentPassword", "Enter your current password");
        return;
      }
      if (!verifyMockUserPassword(member.id, passwordFields.currentPassword)) {
        setPasswordError("currentPassword", "Current password is incorrect");
        return;
      }
      if (passwordFields.newPassword.length < 6) {
        setPasswordError(
          "newPassword",
          "Password must be at least 6 characters",
        );
        return;
      }
      if (passwordFields.newPassword !== passwordFields.confirmPassword) {
        setPasswordError("confirmPassword", "Passwords do not match");
        return;
      }
    }

    // This tab only edits a subset of the full profile record (name/email/
    // address/phone/country) — merge onto the fetched record rather than
    // the update endpoint's other required fields (NIN, bank account,
    // gender, state/city) would fail validation or get wiped out.
    try {
      await updateProfile.mutateAsync({
        memberId: member.id,
        values: {
          ...profile,
          firstName: values.firstName,
          lastName: values.lastName,
          email: values.email,
          homeAddress: values.address,
          phone: values.phone,
          country: values.country,
        },
      });
      logActivity({
        module: "Settings",
        action: "Update",
        resource: "Profile",
      });

      if (anyPasswordFilled) {
        updateMockUserPassword(member.id, passwordFields.newPassword);
        logActivity({
          module: "Settings",
          action: "Update",
          resource: "Password",
          status: "Info",
        });
      }

      clearPasswordFields();
      toast.success("Settings saved");
    } catch (error) {
      toast.error("Couldn't save your settings", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const handleReset = () => {
    reset();
    clearPasswordFields();
  };

  const busy = updateProfile.isPending || uploading;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-6">
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="flex flex-col items-center gap-2">
          <p className="self-start text-sm font-medium text-foreground lg:hidden">
            User Details
          </p>
          <div className="relative shrink-0">
            {member.avatarUrl ? (
              <Image
                src={member.avatarUrl}
                alt={member.name}
                width={96}
                height={96}
                className="size-24 rounded-xl object-cover"
              />
            ) : (
              <span className="flex size-24 items-center justify-center rounded-xl bg-primary text-2xl font-semibold text-primary-foreground">
                {getInitials(member.name)}
              </span>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={handleAvatarChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={busy}
              className="absolute -right-1 -bottom-1 flex size-7 items-center justify-center rounded-full bg-card text-muted-foreground ring-1 ring-border transition-colors hover:text-foreground disabled:opacity-60"
              aria-label="Change profile photo"
            >
              {uploading ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Camera className="size-3.5" aria-hidden="true" />
              )}
            </button>
          </div>
        </div>

        <div className="space-y-4">
          <div className="hidden space-y-1 lg:block">
            <p className="text-sm font-medium text-foreground">User Details</p>
            <p className="text-xs text-muted-foreground">Update your details</p>
          </div>

          <div className="space-y-2">
            <Label htmlFor={membershipIdFieldId}>Membership id</Label>
            <Input
              id={membershipIdFieldId}
              value={member.id}
              disabled
              className="h-11 max-w-sm"
            />
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="First Name"
              placeholder="Enter first name"
              disabled={busy}
              error={errors.firstName?.message}
              registration={register("firstName")}
            />
            <FormField
              label="Last Name"
              placeholder="Enter last name"
              disabled={busy}
              error={errors.lastName?.message}
              registration={register("lastName")}
            />
          </div>

          <FormField
            label="Email"
            type="email"
            placeholder="Enter email"
            disabled={busy}
            error={errors.email?.message}
            registration={register("email")}
          />

          <FormField
            label="Address"
            placeholder="Enter address"
            disabled={busy}
            error={errors.address?.message}
            registration={register("address")}
          />

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <FormField
              label="Phone No"
              placeholder="Enter no"
              disabled={busy}
              error={errors.phone?.message}
              registration={register("phone")}
            />
            <div className="space-y-2">
              <Label>Country</Label>
              <Select
                value={country}
                onValueChange={(value) =>
                  setValue("country", value ?? "", {
                    shouldDirty: true,
                    shouldValidate: true,
                  })
                }
                disabled={busy || countriesLoading}
              >
                <SelectTrigger
                  className="h-11 w-full"
                  aria-invalid={!!errors.country}
                >
                  <SelectValue
                    placeholder={
                      countriesLoading ? "Loading countries…" : "Select Country"
                    }
                  />
                </SelectTrigger>
                <SelectContent>
                  {countries.map((option) => (
                    <SelectItem key={option} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <FieldError message={errors.country?.message} />
            </div>
          </div>
        </div>
      </div>

      <div className="h-px bg-border" />

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[auto_1fr]">
        <div className="hidden lg:block lg:w-24" aria-hidden="true" />
        <div className="space-y-4">
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Password Details
            </p>
            <p className="text-xs text-muted-foreground">
              Update your password details
            </p>
          </div>

          <PasswordField
            id={currentPasswordId}
            label="Current Password"
            value={passwordFields.currentPassword}
            onChange={(value) => {
              setPasswordFieldsState((prev) => ({
                ...prev,
                currentPassword: value,
              }));
              setPasswordErrors((prev) => ({
                ...prev,
                currentPassword: undefined,
              }));
            }}
            disabled={busy}
            error={passwordErrors.currentPassword}
          />
          <PasswordField
            id={newPasswordId}
            label="New Password"
            value={passwordFields.newPassword}
            onChange={(value) => {
              setPasswordFieldsState((prev) => ({
                ...prev,
                newPassword: value,
              }));
              setPasswordErrors((prev) => ({
                ...prev,
                newPassword: undefined,
              }));
            }}
            disabled={busy}
            error={passwordErrors.newPassword}
          />
          <PasswordField
            id={confirmPasswordId}
            label="Confirm New Password"
            value={passwordFields.confirmPassword}
            onChange={(value) => {
              setPasswordFieldsState((prev) => ({
                ...prev,
                confirmPassword: value,
              }));
              setPasswordErrors((prev) => ({
                ...prev,
                confirmPassword: undefined,
              }));
            }}
            disabled={busy}
            error={passwordErrors.confirmPassword}
          />
        </div>
      </div>

      <div className="flex justify-end gap-3">
        <Button
          type="button"
          variant="ghost"
          onClick={handleReset}
          disabled={busy}
        >
          Reset
        </Button>
        <Button
          type="submit"
          disabled={busy || (!isDirty && !passwordFields.currentPassword)}
        >
          {updateProfile.isPending ? (
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

interface FormFieldProps {
  label: string;
  type?: string;
  placeholder?: string;
  disabled?: boolean;
  error?: string;
  registration: ReturnType<
    ReturnType<typeof useForm<SettingsProfileFormValues>>["register"]
  >;
}

function FormField({
  label,
  type = "text",
  placeholder,
  disabled,
  error,
  registration,
}: FormFieldProps) {
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

interface PasswordFieldProps {
  id: string;
  label: string;
  value: string;
  onChange: (value: string) => void;
  disabled?: boolean;
  error?: string;
}

function PasswordField({
  id,
  label,
  value,
  onChange,
  disabled,
  error,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input
        id={id}
        type="password"
        placeholder="Enter password"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        disabled={disabled}
        aria-invalid={!!error}
        className="h-11 max-w-sm"
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
