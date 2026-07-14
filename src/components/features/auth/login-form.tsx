"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { Controller, useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DemoAccounts } from "@/components/features/auth/demo-accounts";
import { useLogin } from "@/hooks/use-login";
import { useAuthStore } from "@/store/auth.store";
import {
  loginSchema,
  type LoginFormValues,
} from "@/lib/validations/auth.schema";

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (index: number) => ({
    opacity: 1,
    y: 0,
    transition: {
      delay: 0.08 * index,
      duration: 0.4,
      ease: "easeOut" as const,
    },
  }),
};

export function LoginForm() {
  const [showPassword, setShowPassword] = useState(false);
  const membershipIdInputId = useId();
  const passwordInputId = useId();

  const router = useRouter();
  const setKeepLoggedIn = useAuthStore((state) => state.setKeepLoggedIn);
  const setMember = useAuthStore((state) => state.setMember);
  const login = useLogin();

  const {
    register,
    handleSubmit,
    control,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: { membershipId: "", password: "", keepLoggedIn: false },
  });

  const fillDemoAccount = (membershipId: string, password: string) => {
    setValue("membershipId", membershipId, { shouldValidate: true });
    setValue("password", password, { shouldValidate: true });
  };

  const onSubmit = handleSubmit(async (values) => {
    login.reset();
    try {
      const response = await login.mutateAsync(values);
      setKeepLoggedIn(values.keepLoggedIn);
      setMember(response.member);
      toast.success("Signed in successfully", {
        description: `Welcome back, ${response.member.name}.`,
      });
      router.push("/dashboard");
    } catch (error) {
      toast.error("Sign in failed", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  const busy = isSubmitting || login.isPending;

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={membershipIdInputId}>Membership ID</Label>
        <Input
          id={membershipIdInputId}
          placeholder="Enter your membership ID"
          autoComplete="username"
          disabled={busy}
          className="h-11"
          aria-invalid={!!errors.membershipId}
          aria-describedby={
            errors.membershipId ? `${membershipIdInputId}-error` : undefined
          }
          {...register("membershipId")}
        />
        <FieldError
          id={`${membershipIdInputId}-error`}
          message={errors.membershipId?.message}
        />
      </motion.div>

      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <div className="flex items-center justify-between">
          <Label htmlFor={passwordInputId}>Password</Label>
          <Link
            href="/forgot-password"
            className="text-sm font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
          >
            Forgot password?
          </Link>
        </div>
        <div className="relative">
          <Input
            id={passwordInputId}
            type={showPassword ? "text" : "password"}
            placeholder="Enter your password"
            autoComplete="current-password"
            disabled={busy}
            aria-invalid={!!errors.password}
            aria-describedby={
              errors.password ? `${passwordInputId}-error` : undefined
            }
            className="h-11 pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            aria-pressed={showPassword}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <FieldError
          id={`${passwordInputId}-error`}
          message={errors.password?.message}
        />
      </motion.div>

      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="flex items-center gap-2"
      >
        <Controller
          control={control}
          name="keepLoggedIn"
          render={({ field }) => (
            <Checkbox
              id="keep-logged-in"
              disabled={busy}
              checked={field.value}
              onCheckedChange={(checked) => field.onChange(checked === true)}
            />
          )}
        />
        <Label
          htmlFor="keep-logged-in"
          className="font-normal text-muted-foreground"
        >
          Keep me logged in
        </Label>
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
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Signing in…
            </>
          ) : (
            "Login"
          )}
        </Button>
      </motion.div>

      <motion.p
        custom={4}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="text-center text-sm text-muted-foreground"
      >
        New to T-Coop?{" "}
        <Link
          href="/register"
          className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline"
        >
          Register Co-operative
        </Link>
      </motion.p>

      <DemoAccounts onSelect={fillDemoAccount} />
    </form>
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
