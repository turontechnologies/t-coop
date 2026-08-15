"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { LockKeyhole, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { PasswordInput } from "@/components/ui/password-input";
import { RouteTransition } from "@/components/brand/route-transition";
import { useResetPassword } from "@/hooks/use-reset-password";
import { usePasswordResetStore } from "@/store/password-reset.store";
import { fieldVariants } from "@/lib/animations";
import {
  createNewPasswordSchema,
  type CreateNewPasswordFormValues,
} from "@/lib/validations/auth.schema";

export function CreateNewPasswordForm() {
  const router = useRouter();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [redirecting, setRedirecting] = useState(false);

  const resetToken = usePasswordResetStore((state) => state.resetToken);
  const clearResetSession = usePasswordResetStore((state) => state.clear);
  const resetPassword = useResetPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateNewPasswordFormValues>({
    resolver: zodResolver(createNewPasswordSchema),
    defaultValues: {
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    if (!resetToken) {
      setError("newPassword", {
        message: "Your session expired — please request a new OTP.",
      });
      return;
    }

    try {
      await resetPassword.mutateAsync({
        resetToken,
        newPassword: values.newPassword,
      });
      setRedirecting(true);
    } catch (error) {
      setError("newPassword", {
        message:
          error instanceof Error
            ? error.message
            : "Couldn't reset your password. Please try again.",
      });
    }
  });

  if (redirecting) {
    return (
      <RouteTransition
        messages={["Updating your password", "Taking you back to login"]}
        onComplete={() => {
          clearResetSession();
          router.push("/login");
        }}
      />
    );
  }

  const busy = isSubmitting || resetPassword.isPending;

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
          <LockKeyhole className="size-5" aria-hidden="true" />
        </span>
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          Create New Password
        </h2>
        <p className="text-sm text-muted-foreground">Welcome to T-Coop</p>
      </motion.div>

      <form onSubmit={onSubmit} noValidate className="space-y-5">
        <motion.div
          custom={1}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="space-y-2"
        >
          <Label htmlFor={newPasswordId}>New Password</Label>
          <PasswordInput
            id={newPasswordId}
            placeholder="Enter password"
            autoComplete="new-password"
            disabled={busy}
            aria-invalid={!!errors.newPassword}
            aria-describedby={
              errors.newPassword ? `${newPasswordId}-error` : undefined
            }
            className="h-11"
            {...register("newPassword")}
          />
          <FieldError
            id={`${newPasswordId}-error`}
            message={errors.newPassword?.message}
          />
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
          className="space-y-2"
        >
          <Label htmlFor={confirmPasswordId}>Confirm Password</Label>
          <PasswordInput
            id={confirmPasswordId}
            placeholder="Enter password"
            autoComplete="new-password"
            disabled={busy}
            aria-invalid={!!errors.confirmPassword}
            aria-describedby={
              errors.confirmPassword ? `${confirmPasswordId}-error` : undefined
            }
            className="h-11"
            {...register("confirmPassword")}
          />
          <FieldError
            id={`${confirmPasswordId}-error`}
            message={errors.confirmPassword?.message}
          />
        </motion.div>

        <motion.div
          custom={3}
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
            {busy ? "Saving…" : "Save New Password"}
          </Button>
        </motion.div>
      </form>

      <motion.div
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="text-center text-sm"
      >
        <Link
          href="/login"
          onClick={() => clearResetSession()}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
        >
          Return to login
        </Link>
      </motion.div>
    </div>
  );
}

function FieldError({ id, message }: { id: string; message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
          id={id}
          role="alert"
          initial={{ opacity: 0, height: 0 }}
          animate={{ opacity: 1, height: "auto" }}
          exit={{ opacity: 0, height: 0 }}
          transition={{ duration: 0.2 }}
          className="flex items-center gap-1.5 text-sm text-destructive"
        >
          <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
          {message}
        </motion.p>
      ) : null}
    </AnimatePresence>
  );
}
