"use client";

import { useId, useState } from "react";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { motion } from "framer-motion";
import { ChevronDown, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteTransition } from "@/components/brand/route-transition";
import { useRegister } from "@/hooks/use-register";
import { COUNTRIES } from "@/lib/countries";
import { fieldVariants } from "@/lib/animations";
import {
  registerCooperativeSchema,
  type RegisterCooperativeFormValues,
} from "@/lib/validations/auth.schema";

export function RegisterForm() {
  const router = useRouter();
  const registerCooperative = useRegister();
  const [submitted, setSubmitted] = useState(false);

  const membershipIdId = useId();
  const coopNameId = useId();
  const firstNameId = useId();
  const lastNameId = useId();
  const emailId = useId();
  const phoneId = useId();
  const countryId = useId();

  const {
    register,
    handleSubmit,
    control,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<RegisterCooperativeFormValues>({
    resolver: zodResolver(registerCooperativeSchema),
    defaultValues: {
      membershipId: "",
      coopName: "",
      firstName: "",
      lastName: "",
      email: "",
      phone: "",
      country: "",
      agreeToTerms: false,
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    registerCooperative.reset();
    try {
      await registerCooperative.mutateAsync(values);
      setSubmitted(true);
    } catch (error) {
      setError("membershipId", {
        message:
          error instanceof Error
            ? error.message
            : "We couldn't submit your registration. Please try again.",
      });
    }
  });

  const showTermsNotice = () =>
    toast.info("Coming soon", {
      description: "This document isn't published yet.",
    });

  const busy = isSubmitting || registerCooperative.isPending;

  if (submitted) {
    return (
      <RouteTransition
        messages={["Registration received", "Taking you to login"]}
        onComplete={() => router.push("/login")}
      />
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={membershipIdId}>Membership id</Label>
        <Input
          id={membershipIdId}
          placeholder="Enter id"
          disabled={busy}
          className="h-11"
          aria-invalid={!!errors.membershipId}
          {...register("membershipId")}
        />
        <FieldError message={errors.membershipId?.message} />
      </motion.div>

      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={coopNameId}>Co-operative name</Label>
        <Input
          id={coopNameId}
          placeholder="Enter co-op name"
          disabled={busy}
          className="h-11"
          aria-invalid={!!errors.coopName}
          {...register("coopName")}
        />
        <FieldError message={errors.coopName?.message} />
      </motion.div>

      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor={firstNameId}>First Name</Label>
          <Input
            id={firstNameId}
            placeholder="Enter first name"
            disabled={busy}
            className="h-11"
            aria-invalid={!!errors.firstName}
            {...register("firstName")}
          />
          <FieldError message={errors.firstName?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={lastNameId}>Last Name</Label>
          <Input
            id={lastNameId}
            placeholder="Enter last name"
            disabled={busy}
            className="h-11"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </motion.div>

      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={emailId}>Email</Label>
        <Input
          id={emailId}
          type="email"
          placeholder="Enter email"
          disabled={busy}
          className="h-11"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        <FieldError message={errors.email?.message} />
      </motion.div>

      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="grid grid-cols-1 gap-4 sm:grid-cols-2"
      >
        <div className="space-y-2">
          <Label htmlFor={phoneId}>Phone No</Label>
          <Input
            id={phoneId}
            type="tel"
            placeholder="Enter no"
            disabled={busy}
            className="h-11"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          <FieldError message={errors.phone?.message} />
        </div>
        <div className="space-y-2">
          <Label htmlFor={countryId}>Country</Label>
          <div className="relative">
            <select
              id={countryId}
              disabled={busy}
              aria-invalid={!!errors.country}
              defaultValue=""
              className="h-11 w-full appearance-none rounded-lg border border-input bg-transparent px-2.5 pr-8 text-base outline-none transition-colors focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30"
              {...register("country")}
            >
              <option value="" disabled>
                Select Country
              </option>
              {COUNTRIES.map((country) => (
                <option key={country} value={country}>
                  {country}
                </option>
              ))}
            </select>
            <ChevronDown
              className="pointer-events-none absolute top-1/2 right-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
          </div>
          <FieldError message={errors.country?.message} />
        </div>
      </motion.div>

      <motion.div
        custom={5}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-1.5"
      >
        <div className="flex items-start gap-2">
          <Controller
            control={control}
            name="agreeToTerms"
            render={({ field }) => (
              <Checkbox
                id="agree-to-terms"
                disabled={busy}
                checked={field.value}
                onCheckedChange={(checked) => field.onChange(checked === true)}
                className="mt-0.5"
              />
            )}
          />
          <Label
            htmlFor="agree-to-terms"
            className="text-sm font-normal text-muted-foreground"
          >
            I agree to{" "}
            <button
              type="button"
              onClick={showTermsNotice}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              terms of use
            </button>{" "}
            and{" "}
            <button
              type="button"
              onClick={showTermsNotice}
              className="font-semibold text-primary underline-offset-4 hover:underline"
            >
              privacy policy
            </button>
          </Label>
        </div>
        <FieldError message={errors.agreeToTerms?.message} />
      </motion.div>

      <motion.div
        custom={6}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
      >
        <Button
          type="submit"
          className="h-11 w-full text-base"
          size="lg"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Creating account…
            </>
          ) : (
            "Create Account"
          )}
        </Button>
      </motion.div>
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
