"use client";

import { useEffect, useId } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { BadgeCheck, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
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
import { useAutoVerifyBankAccount } from "@/hooks/use-auto-verify-bank-account";
import { useBankList } from "@/hooks/use-bank-list";
import { useAddCoopMember } from "@/hooks/use-coop-members";
import { useNextMemberId } from "@/hooks/use-next-id";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import {
  addMemberSchema,
  type AddMemberFormValues,
} from "@/lib/validations/member-directory.schema";

interface AddMemberFormProps {
  coopId: string;
  existingMembers: CoopMember[];
}

/** Naive "JOHN DOE" -> { firstName: "John", lastName: "Doe" } split — a resolved bank account name has no first/last boundary marker, this is the best a bank resolve can offer. */
function splitResolvedName(fullName: string): {
  firstName: string;
  lastName: string;
} {
  const parts = fullName.trim().split(/\s+/);
  const toTitleCase = (word: string) =>
    word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
  return {
    firstName: toTitleCase(parts[0] ?? ""),
    lastName: parts.slice(1).map(toTitleCase).join(" "),
  };
}

export function AddMemberForm({ coopId, existingMembers }: AddMemberFormProps) {
  const router = useRouter();
  const addMember = useAddCoopMember(coopId);
  const { banks, loading: banksLoading } = useBankList();
  const { data: nextMemberId, isLoading: loadingNextId } =
    useNextMemberId(coopId);

  const bankId = useId();
  const accountNumberId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const otherNameId = useId();
  const genderId = useId();
  const phoneId = useId();
  const emailId = useId();
  const homeAddressId = useId();
  const facebookId = useId();
  const membershipIdId = useId();
  const guarantorId = useId();
  const roleId = useId();
  const twitterId = useId();

  const {
    register,
    handleSubmit,
    control,
    watch,
    setValue,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<AddMemberFormValues>({
    resolver: zodResolver(addMemberSchema),
    defaultValues: {
      accountNumber: "",
      bankCode: "",
      accountName: "",
      firstName: "",
      lastName: "",
      otherName: "",
      phone: "",
      email: "",
      homeAddress: "",
      country: "",
      state: "",
      city: "",
      facebook: "",
      membershipId: "",
      guarantor: "",
      role: "Member",
      twitter: "",
    },
  });

  const accountName = watch("accountName");
  const bankCode = watch("bankCode");
  const accountNumber = watch("accountNumber");
  const verified = !!accountName;

  // Auto-generated per this co-op's own configured format (Settings -> Co-operative -> Member ID
  // Format) — read-only here, not something the admin types per member.
  useEffect(() => {
    if (nextMemberId)
      setValue("membershipId", nextMemberId, { shouldValidate: true });
  }, [nextMemberId, setValue]);

  const { verifying } = useAutoVerifyBankAccount({
    bankCode,
    accountNumber,
    onVerified: (resolvedName) => {
      const { firstName, lastName } = splitResolvedName(resolvedName);
      setValue("accountName", resolvedName, { shouldValidate: true });
      setValue("firstName", firstName, { shouldValidate: true });
      setValue("lastName", lastName, { shouldValidate: true });
    },
    onError: (message) => setError("accountNumber", { message }),
  });

  const onSubmit = handleSubmit(async (values) => {
    const isTaken = existingMembers.some(
      (member) =>
        member.id.toLowerCase() === values.membershipId.trim().toLowerCase(),
    );
    if (isTaken) {
      setError("membershipId", {
        message: "That membership ID is already in use. Please choose another.",
      });
      return;
    }

    try {
      const member = await addMember.mutateAsync({
        ...values,
        membershipId: values.membershipId.trim(),
        firstName: values.firstName.trim(),
        lastName: values.lastName.trim(),
        email: values.email.trim(),
      });
      toast.success("Member added", {
        description: `${coopMemberFullName(member)} has been added — a welcome email with their login (membership ID + default password) was sent to ${member.email}.`,
      });
      router.push(`/members/${member.id}`);
    } catch (error) {
      if (error instanceof Error && /membership id/i.test(error.message)) {
        setError("membershipId", { message: error.message });
        return;
      }
      toast.error("Couldn't add that member", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

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
          <CardTitle>Member Details</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>Bank Account</Label>
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Combobox
                    id={bankId}
                    value={field.value ?? ""}
                    onValueChange={field.onChange}
                    options={banks.map((bank) => ({
                      value: bank.code,
                      label: bank.name,
                    }))}
                    placeholder="Select bank"
                    searchPlaceholder="Search banks…"
                    loading={banksLoading}
                    disabled={verifying || verified}
                    ariaInvalid={!!errors.bankCode}
                  />
                )}
              />
              <Input
                id={accountNumberId}
                placeholder="10-digit account number"
                disabled={verifying || verified}
                className="h-11"
                aria-invalid={!!errors.accountNumber}
                {...register("accountNumber")}
              />
            </div>
            <FieldError
              message={
                errors.accountNumber?.message ?? errors.bankCode?.message
              }
            />
            {verifying ? (
              <p className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground">
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
                Verifying with the bank…
              </p>
            ) : verified ? (
              <p className="flex items-center gap-1 text-xs font-medium text-success">
                <BadgeCheck className="size-3.5" aria-hidden="true" />
                {accountName}
              </p>
            ) : (
              <p className="text-xs text-muted-foreground">
                Select a bank and enter the account number — it verifies
                automatically. This is where the member&apos;s loan
                disbursements and savings withdrawals will be paid out to.
              </p>
            )}
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor={firstNameId}>First Name</Label>
              <Input
                id={firstNameId}
                placeholder="Auto filled once verified"
                disabled={!verified || isSubmitting}
                aria-invalid={!!errors.firstName}
                className="h-11"
                {...register("firstName")}
              />
              <FieldError message={errors.firstName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={lastNameId}>Last Name</Label>
              <Input
                id={lastNameId}
                placeholder="Auto filled once verified"
                disabled={!verified || isSubmitting}
                aria-invalid={!!errors.lastName}
                className="h-11"
                {...register("lastName")}
              />
              <FieldError message={errors.lastName?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={otherNameId}>Other Name</Label>
              <Input
                id={otherNameId}
                placeholder="Enter other name"
                disabled={isSubmitting}
                className="h-11"
                {...register("otherName")}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={genderId}>Gender</Label>
              <Controller
                control={control}
                name="gender"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) =>
                      field.onChange(
                        value === ""
                          ? undefined
                          : (value as typeof field.value),
                      )
                    }
                    disabled={isSubmitting}
                  >
                    <SelectTrigger id={genderId} className="h-11 w-full">
                      <SelectValue placeholder="Select gender" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Male">Male</SelectItem>
                      <SelectItem value="Female">Female</SelectItem>
                      <SelectItem value="Other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                )}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor={phoneId}>Phone</Label>
              <Input
                id={phoneId}
                type="tel"
                placeholder="Enter phone number"
                disabled={!verified || isSubmitting}
                aria-invalid={!!errors.phone}
                className="h-11"
                {...register("phone")}
              />
              <FieldError message={errors.phone?.message} />
            </div>
            <div className="space-y-2">
              <Label htmlFor={emailId}>Email</Label>
              <Input
                id={emailId}
                type="email"
                placeholder="Enter email address"
                disabled={!verified || isSubmitting}
                aria-invalid={!!errors.email}
                className="h-11"
                {...register("email")}
              />
              <FieldError message={errors.email?.message} />
            </div>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Address</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2 sm:col-span-2">
            <Label htmlFor={homeAddressId}>Home Address</Label>
            <Input
              id={homeAddressId}
              placeholder="Enter home address"
              disabled={isSubmitting}
              className="h-11"
              {...register("homeAddress")}
            />
          </div>
          <LocationFields
            country={watch("country")}
            state={watch("state") ?? ""}
            city={watch("city") ?? ""}
            onCountryChange={(value) =>
              setValue("country", value, { shouldValidate: true })
            }
            onStateChange={(value) => setValue("state", value)}
            onCityChange={(value) => setValue("city", value)}
            disabled={isSubmitting}
            countryError={errors.country?.message}
          />
          <div className="space-y-2">
            <Label htmlFor={facebookId}>Facebook</Label>
            <Input
              id={facebookId}
              placeholder="Enter facebook name"
              disabled={isSubmitting}
              className="h-11"
              {...register("facebook")}
            />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Membership</CardTitle>
        </CardHeader>
        <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor={membershipIdId}>Membership ID</Label>
            <Input
              id={membershipIdId}
              placeholder={loadingNextId ? "Generating…" : undefined}
              disabled
              aria-invalid={!!errors.membershipId}
              className="h-11"
              {...register("membershipId")}
            />
            <p className="text-xs text-muted-foreground">
              Auto-generated — change the format in Settings.
            </p>
            <FieldError message={errors.membershipId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={guarantorId}>Select Guarantor</Label>
            <Controller
              control={control}
              name="guarantor"
              render={({ field }) => (
                <Combobox
                  id={guarantorId}
                  value={field.value ?? ""}
                  onValueChange={field.onChange}
                  options={existingMembers.map((member) => ({
                    value: coopMemberFullName(member),
                    label: coopMemberFullName(member),
                  }))}
                  placeholder="Select guarantor"
                  searchPlaceholder="Search members…"
                  disabled={isSubmitting}
                  ariaInvalid={!!errors.guarantor}
                />
              )}
            />
            <FieldError message={errors.guarantor?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={roleId}>User Access</Label>
            <Controller
              control={control}
              name="role"
              render={({ field }) => (
                <Select
                  value={field.value}
                  onValueChange={(value) => field.onChange(value ?? "Member")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger id={roleId} className="h-11 w-full">
                    <SelectValue placeholder="Select access e.g Admin or Member" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Member">Member</SelectItem>
                    <SelectItem value="Admin">Admin</SelectItem>
                  </SelectContent>
                </Select>
              )}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={twitterId}>Twitter</Label>
            <Input
              id={twitterId}
              placeholder="Enter twitter name"
              disabled={isSubmitting}
              className="h-11"
              {...register("twitter")}
            />
          </div>
        </CardContent>
      </Card>

      <div className="flex flex-col-reverse justify-end gap-3 sm:flex-row">
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.push("/members")}
          disabled={isSubmitting}
        >
          Cancel
        </Button>
        <Button type="submit" disabled={isSubmitting} className="sm:w-44">
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Adding…
            </>
          ) : (
            "Add New Members"
          )}
        </Button>
      </div>
    </motion.form>
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
