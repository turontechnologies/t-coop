"use client";

import { useId } from "react";
import Link from "next/link";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { KeyRound, Loader2, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { fieldVariants } from "@/lib/animations";
import {
  forgotPasswordSchema,
  type ForgotPasswordFormValues,
} from "@/lib/validations/auth.schema";
import type { AuthenticatedMember } from "@/types/auth";

interface ForgotPasswordFormProps {
  onSent: (email: string, otp: string, member: AuthenticatedMember) => void;
}

export function ForgotPasswordForm({ onSent }: ForgotPasswordFormProps) {
  const emailInputId = useId();
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<ForgotPasswordFormValues>({
    resolver: zodResolver(forgotPasswordSchema),
    defaultValues: { email: "" },
  });

  const onSubmit = handleSubmit(async (values) => {
    forgotPassword.reset();
    try {
      const response = await forgotPassword.mutateAsync(values);
      onSent(values.email, response.otp, response.member);
    } catch (error) {
      setError("email", {
        message:
          error instanceof Error
            ? error.message
            : "We couldn't send an OTP. Please try again.",
      });
    }
  });

  const busy = isSubmitting || forgotPassword.isPending;

  return (
    <div className="space-y-6">
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-1.5 text-center"
      >
        <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
          <KeyRound className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Forgot your password?
        </h2>
        <p className="text-sm text-muted-foreground">
          Enter the email linked to your account and we&apos;ll send you a
          one-time password to verify it&apos;s you.
        </p>
      </motion.div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="space-y-2"
        >
          <Label htmlFor={emailInputId}>Email address</Label>
          <Input
            id={emailInputId}
            type="email"
            placeholder="you@example.com"
            autoComplete="email"
            disabled={busy}
            className="h-11"
            aria-invalid={!!errors.email}
            aria-describedby={
              errors.email ? `${emailInputId}-error` : undefined
            }
            {...register("email")}
          />
          <AnimatePresence initial={false}>
            {errors.email?.message ? (
              <motion.p
                id={`${emailInputId}-error`}
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-start gap-1.5 text-sm text-destructive"
              >
                <TriangleAlert
                  className="mt-0.5 size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {errors.email.message}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </motion.div>

        <motion.div
          custom={2}
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
                Sending OTP…
              </>
            ) : (
              "Send OTP"
            )}
          </Button>
        </motion.div>
      </form>

      <motion.div
        custom={3}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2 text-center text-sm"
      >
        <p className="text-muted-foreground">
          New to T-Coop?{" "}
          <Link
            href="/register"
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline"
          >
            Register Co-operative
          </Link>
        </p>
        <Link
          href="/login"
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
        >
          Return to login
        </Link>
      </motion.div>
    </div>
  );
}
