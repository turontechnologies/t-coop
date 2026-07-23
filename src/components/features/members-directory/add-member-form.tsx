"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
import { resolveBankAccount } from "@/lib/bank-lookup";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { ADMIN_DIRECTORY_COOP_ID } from "@/lib/member-directory";
import {
  addMemberSchema,
  type AddMemberFormValues,
} from "@/lib/validations/member-directory.schema";
import { useCoopStore } from "@/store/coop.store";

interface AddMemberFormProps {
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

export function AddMemberForm({ existingMembers }: AddMemberFormProps) {
  const router = useRouter();
  const [verifying, setVerifying] = useState(false);
  const addMember = useCoopStore((state) => state.addMember);
  const { banks, loading: banksLoading } = useBankList();

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
    trigger,
    getValues,
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
  const verified = !!accountName;

  const handleVerify = async () => {
    const fieldsValid = await trigger(["accountNumber", "bankCode"]);
    if (!fieldsValid) return;

    setVerifying(true);
    try {
      const resolvedName = await resolveBankAccount(
        getValues("accountNumber"),
        getValues("bankCode"),
      );
      const { firstName, lastName } = splitResolvedName(resolvedName);
      setValue("accountName", resolvedName, { shouldValidate: true });
      setValue("firstName", firstName, { shouldValidate: true });
      setValue("lastName", lastName, { shouldValidate: true });
      toast.success("Account verified", {
        description: `${resolvedName} — name auto-filled below.`,
      });
    } catch (error) {
      setError("accountNumber", {
        message:
          error instanceof Error ? error.message : "Verification failed.",
      });
    } finally {
      setVerifying(false);
    }
  };

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

    await new Promise((resolve) => setTimeout(resolve, 900));

    const member: CoopMember = {
      id: values.membershipId.trim(),
      firstName: values.firstName.trim(),
      lastName: values.lastName.trim(),
      email: values.email.trim(),
      role: values.role,
      status: "Active",
      guarantor: values.guarantor,
      country: values.country,
      state: values.state?.trim() ?? "",
      city: values.city?.trim() ?? "",
      bankCode: values.bankCode,
      accountNumber: values.accountNumber,
      accountName: values.accountName ?? "",
    };

    addMember(ADMIN_DIRECTORY_COOP_ID, member);
    toast.success("Member added", {
      description: `${coopMemberFullName(member)} has been added to the directory.`,
    });
    router.push(`/members/${member.id}`);
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
            <div className="grid grid-cols-1 gap-2 sm:grid-cols-[1fr_1fr_auto]">
              <Controller
                control={control}
                name="bankCode"
                render={({ field }) => (
                  <Select
                    value={field.value ?? ""}
                    onValueChange={(value) => field.onChange(value ?? "")}
                    disabled={verifying || verified || banksLoading}
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
                disabled={verifying || verified}
                className="h-11"
                aria-invalid={!!errors.accountNumber}
                {...register("accountNumber")}
              />
              <Button
                type="button"
                onClick={handleVerify}
                disabled={verifying || verified}
                className="h-11 sm:w-32"
              >
                {verifying ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : verified ? (
                  "Verified"
                ) : (
                  "Verify"
                )}
              </Button>
            </div>
            <FieldError
              message={
                errors.accountNumber?.message ?? errors.bankCode?.message
              }
            />
            {verified ? (
              <p className="text-xs font-medium text-success">{accountName}</p>
            ) : (
              <p className="text-xs text-muted-foreground">
                This is where the member&apos;s loan disbursements and savings
                withdrawals will be paid out to.
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
              placeholder="Enter membership ID"
              disabled={isSubmitting}
              aria-invalid={!!errors.membershipId}
              className="h-11"
              {...register("membershipId")}
            />
            <FieldError message={errors.membershipId?.message} />
          </div>
          <div className="space-y-2">
            <Label htmlFor={guarantorId}>Select Guarantor</Label>
            <Controller
              control={control}
              name="guarantor"
              render={({ field }) => (
                <Select
                  value={field.value ?? ""}
                  onValueChange={(value) => field.onChange(value ?? "")}
                  disabled={isSubmitting}
                >
                  <SelectTrigger
                    id={guarantorId}
                    className="h-11 w-full"
                    aria-invalid={!!errors.guarantor}
                  >
                    <SelectValue placeholder="Select guarantor" />
                  </SelectTrigger>
                  <SelectContent>
                    {existingMembers.map((member) => (
                      <SelectItem
                        key={member.id}
                        value={coopMemberFullName(member)}
                      >
                        {coopMemberFullName(member)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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
