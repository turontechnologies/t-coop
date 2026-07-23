"use client";

import { useId, useState, type ReactNode } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Controller,
  useForm,
  type Control,
  type FieldPath,
  type UseFormRegisterReturn,
} from "react-hook-form";
import { motion } from "framer-motion";
import { BadgeCheck, Loader2, Pencil, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardAction,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { LocationFields } from "@/components/features/shared/location-fields";
import { useBankList } from "@/hooks/use-bank-list";
import { useUpdateProfile } from "@/hooks/use-update-profile";
import { resolveBankAccount } from "@/lib/bank-lookup";
import { findBankByCode } from "@/lib/bank-data";
import type { ProfileRecord } from "@/lib/profile-data";
import {
  profileSchema,
  type ProfileFormValues,
} from "@/lib/validations/profile.schema";

interface ProfileDetailsFormProps {
  memberId: string;
  profile: ProfileRecord;
}

export function ProfileDetailsForm({
  memberId,
  profile,
}: ProfileDetailsFormProps) {
  const [editing, setEditing] = useState(false);
  const [displayProfile, setDisplayProfile] = useState(profile);
  const [verifyingAccount, setVerifyingAccount] = useState(false);
  const membershipIdFieldId = useId();
  const bankId = useId();
  const accountNumberId = useId();
  const updateProfile = useUpdateProfile();
  const { banks, loading: banksLoading } = useBankList();

  const {
    register,
    control,
    handleSubmit,
    reset,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: displayProfile,
  });

  const accountName = watch("accountName");
  const accountNumber = watch("accountNumber");
  const bankCode = watch("bankCode");

  const invalidateAccountName = () => {
    if (accountName) setValue("accountName", "", { shouldDirty: true });
  };

  const handleVerifyAccount = async () => {
    setVerifyingAccount(true);
    try {
      const resolvedName = await resolveBankAccount(accountNumber, bankCode);
      setValue("accountName", resolvedName, { shouldDirty: true });
      toast.success("Account verified", {
        description: resolvedName,
      });
    } catch (error) {
      toast.error("Couldn't verify that account", {
        description: error instanceof Error ? error.message : undefined,
      });
    } finally {
      setVerifyingAccount(false);
    }
  };

  const onSubmit = handleSubmit(async (values) => {
    updateProfile.reset();
    try {
      await updateProfile.mutateAsync({ memberId, values });
      setDisplayProfile({ membershipId: memberId, ...values });
      reset(values);
      setEditing(false);
      toast.success("Profile updated successfully");
    } catch (error) {
      toast.error("Couldn't update your profile", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  });

  const handleCancel = () => {
    reset(displayProfile);
    setEditing(false);
  };

  const busy = isSubmitting || updateProfile.isPending;

  if (!editing) {
    return (
      <ProfileReadOnlyView
        memberId={memberId}
        profile={displayProfile}
        onEdit={() => setEditing(true)}
      />
    );
  }

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
          <div className="space-y-2 sm:col-span-2">
            <Label>Bank Account</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => {
                      field.onChange(value ?? "");
                      invalidateAccountName();
                    }}
                    disabled={busy || banksLoading}
                  >
                    <SelectTrigger
                      id={bankId}
                      className="h-11 w-full"
                      aria-invalid={!!errors.bankCode}
                    >
                      <SelectValue
                        placeholder={
                          banksLoading ? "Loading banks…" : "Select bank"
                        }
                      />
                    </SelectTrigger>
                    <SelectContent>
                      {banks.map((bank) => (
                        <SelectItem key={bank.code} value={bank.code}>
                          {bank.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              />
              <Input
                id={accountNumberId}
                placeholder="10-digit account number"
                disabled={busy}
                aria-invalid={!!errors.accountNumber}
                className="h-11"
                {...register("accountNumber", {
                  onChange: invalidateAccountName,
                })}
              />
              <Button
                type="button"
                onClick={handleVerifyAccount}
                disabled={
                  busy ||
                  verifyingAccount ||
                  !bankCode ||
                  accountNumber?.length !== 10
                }
                className="h-11"
              >
                {verifyingAccount ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : accountName ? (
                  "Verified"
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <FieldError
              message={
                errors.bankCode?.message ?? errors.accountNumber?.message
              }
            />
            {accountName ? (
              <p className="flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {accountName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a bank, enter the account number, then Verify — this is
                where payouts (loan disbursement, savings withdrawal) will be
                sent.
              </p>
            )}
          </div>
          <ProfileField
            label="National Identification Number (NIN)"
            required
            registration={register("nin")}
            error={errors.nin?.message}
            disabled={busy}
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
            control={control}
            name="gender"
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
          disabled={busy}
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

interface ProfileReadOnlyViewProps {
  memberId: string;
  profile: ProfileRecord;
  onEdit: () => void;
}

function ProfileReadOnlyView({
  memberId,
  profile,
  onEdit,
}: ProfileReadOnlyViewProps) {
  const { banks } = useBankList();
  const verifiedBadge = (
    <span className="flex items-center gap-1 text-xs font-medium text-success">
      <BadgeCheck className="size-3.5" aria-hidden="true" />
      Verified
    </span>
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Personal Information</CardTitle>
          <CardAction>
            <Button size="sm" variant="outline" onClick={onEdit}>
              <Pencil className="size-3.5" aria-hidden="true" />
              Edit
            </Button>
          </CardAction>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileViewField
            label="Bank Account"
            value={
              profile.accountNumber
                ? `${findBankByCode(banks, profile.bankCode)?.name ?? profile.bankCode} — ${profile.accountNumber}`
                : undefined
            }
            trailing={profile.accountName ? verifiedBadge : undefined}
          />
          <ProfileViewField
            label="National Identification Number (NIN)"
            value={profile.nin}
            trailing={verifiedBadge}
          />
          <ProfileViewField label="First Name" value={profile.firstName} />
          <ProfileViewField label="Last Name" value={profile.lastName} />
          <ProfileViewField label="Other Name" value={profile.otherName} />
          <ProfileViewField label="Gender" value={profile.gender} />
          <ProfileViewField label="Phone" value={profile.phone} />
          <ProfileViewField label="Email" value={profile.email} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileViewField label="Home Address" value={profile.homeAddress} />
          <ProfileViewField label="Country" value={profile.country} />
          <ProfileViewField label="State" value={profile.state} />
          <ProfileViewField
            label="City / Local Government"
            value={profile.city}
          />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Social Links</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileViewField label="Facebook" value={profile.facebook} />
          <ProfileViewField label="Twitter" value={profile.twitter} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <ProfileViewField label="Membership ID" value={memberId} />
          <ProfileViewField label="Guarantor" value={profile.guarantor} />
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ProfileViewFieldProps {
  label: string;
  value?: string;
  trailing?: ReactNode;
}

function ProfileViewField({ label, value, trailing }: ProfileViewFieldProps) {
  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <p className="text-xs text-muted-foreground">{label}</p>
        {trailing}
      </div>
      <p className="text-sm font-medium text-foreground">
        {value && value.trim() ? value : "—"}
      </p>
    </div>
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
  control: Control<ProfileFormValues>;
  name: FieldPath<ProfileFormValues>;
}

function ProfileSelect({
  label,
  required,
  disabled,
  error,
  options,
  control,
  name,
}: ProfileSelectProps) {
  const id = useId();
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>
        {label}
        {required ? <span className="ml-0.5 text-destructive">*</span> : null}
      </Label>
      <Controller
        control={control}
        name={name}
        render={({ field }) => (
          <Select
            value={field.value ?? ""}
            onValueChange={(value) => field.onChange(value ?? "")}
            disabled={disabled}
          >
            <SelectTrigger
              id={id}
              className="h-11 w-full"
              aria-invalid={!!error}
            >
              <SelectValue placeholder="Select" />
            </SelectTrigger>
            <SelectContent>
              {options.map((option) => (
                <SelectItem key={option} value={option}>
                  {option}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}
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
