"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, LockKeyhole, TriangleAlert } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteTransition } from "@/components/brand/route-transition";
import { usePasswordResetStore } from "@/store/password-reset.store";
import {
  updateMockUserPassword,
  verifyMockUserPassword,
} from "@/lib/mock-users";
import { fieldVariants } from "@/lib/animations";
import {
  createNewPasswordSchema,
  type CreateNewPasswordFormValues,
} from "@/lib/validations/auth.schema";

export function CreateNewPasswordForm() {
  const router = useRouter();
  const currentPasswordId = useId();
  const newPasswordId = useId();
  const confirmPasswordId = useId();

  const [reveal, setReveal] = useState({
    current: false,
    next: false,
    confirm: false,
  });
  const [redirecting, setRedirecting] = useState(false);

  const member = usePasswordResetStore((state) => state.member);
  const clearResetSession = usePasswordResetStore((state) => state.clear);

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<CreateNewPasswordFormValues>({
    resolver: zodResolver(createNewPasswordSchema),
    defaultValues: {
      currentPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit((values) => {
    if (!member) return;

    if (!verifyMockUserPassword(member.id, values.currentPassword)) {
      setError("currentPassword", {
        message: "Current password is incorrect",
      });
      return;
    }

    updateMockUserPassword(member.id, values.newPassword);
    setRedirecting(true);
  });

  if (redirecting) {
    return (
      <RouteTransition
        messages={["Updating your password", "Taking you back to login"]}
        onComplete={() => router.push("/login")}
      />
    );
  }

  const busy = isSubmitting;

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
        >
          <PasswordField
            id={currentPasswordId}
            label="Current Password"
            revealed={reveal.current}
            onToggleReveal={() =>
              setReveal((state) => ({ ...state, current: !state.current }))
            }
            disabled={busy}
            error={errors.currentPassword?.message}
            registration={register("currentPassword")}
            autoComplete="current-password"
          />
        </motion.div>

        <motion.div
          custom={2}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
        >
          <PasswordField
            id={newPasswordId}
            label="New Password"
            revealed={reveal.next}
            onToggleReveal={() =>
              setReveal((state) => ({ ...state, next: !state.next }))
            }
            disabled={busy}
            error={errors.newPassword?.message}
            registration={register("newPassword")}
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div
          custom={3}
          initial="hidden"
          animate="visible"
          variants={fieldVariants}
        >
          <PasswordField
            id={confirmPasswordId}
            label="Confirm Password"
            revealed={reveal.confirm}
            onToggleReveal={() =>
              setReveal((state) => ({ ...state, confirm: !state.confirm }))
            }
            disabled={busy}
            error={errors.confirmPassword?.message}
            registration={register("confirmPassword")}
            autoComplete="new-password"
          />
        </motion.div>

        <motion.div
          custom={4}
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
            Login
          </Button>
        </motion.div>
      </form>

      <motion.div
        custom={5}
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
            Create Account
          </Link>
        </p>
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

interface PasswordFieldProps {
  id: string;
  label: string;
  revealed: boolean;
  onToggleReveal: () => void;
  disabled: boolean;
  error?: string;
  autoComplete: string;
  registration: ReturnType<
    ReturnType<typeof useForm<CreateNewPasswordFormValues>>["register"]
  >;
}

function PasswordField({
  id,
  label,
  revealed,
  onToggleReveal,
  disabled,
  error,
  autoComplete,
  registration,
}: PasswordFieldProps) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="relative">
        <Input
          id={id}
          type={revealed ? "text" : "password"}
          placeholder="Enter password"
          autoComplete={autoComplete}
          disabled={disabled}
          aria-invalid={!!error}
          aria-describedby={error ? `${id}-error` : undefined}
          className="h-11 pr-10"
          {...registration}
        />
        <button
          type="button"
          onClick={onToggleReveal}
          className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
          aria-label={revealed ? "Hide password" : "Show password"}
          aria-pressed={revealed}
          tabIndex={-1}
        >
          {revealed ? (
            <EyeOff className="size-4" aria-hidden="true" />
          ) : (
            <Eye className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
      <AnimatePresence initial={false}>
        {error ? (
          <motion.p
            id={`${id}-error`}
            role="alert"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: "auto" }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center gap-1.5 text-sm text-destructive"
          >
            <TriangleAlert className="size-3.5 shrink-0" aria-hidden="true" />
            {error}
          </motion.p>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
