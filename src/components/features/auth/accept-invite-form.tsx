"use client";

import { useEffect, useId, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Eye, EyeOff, Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteTransition } from "@/components/brand/route-transition";
import {
  platformInviteService,
  type InviteInfo,
} from "@/services/platform-invite.service";
import { fieldVariants } from "@/lib/animations";
import { markAppIntroShown } from "@/lib/app-intro";
import { useAuthStore } from "@/store/auth.store";
import {
  acceptInviteSchema,
  type AcceptInviteFormValues,
} from "@/lib/validations/auth.schema";

export function AcceptInviteForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token") ?? "";
  const setMember = useAuthStore((state) => state.setMember);
  const setToken = useAuthStore((state) => state.setToken);
  const setKeepLoggedIn = useAuthStore((state) => state.setKeepLoggedIn);

  const [invite, setInvite] = useState<InviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const firstNameId = useId();
  const lastNameId = useId();
  const passwordId = useId();
  const confirmPasswordId = useId();

  useEffect(() => {
    if (!token) {
      setLoadError("This invite link is missing its token.");
      setChecking(false);
      return;
    }
    platformInviteService
      .getInvite(token)
      .then(setInvite)
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "This invite link is invalid or has expired.",
        );
      })
      .finally(() => setChecking(false));
  }, [token]);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<AcceptInviteFormValues>({
    resolver: zodResolver(acceptInviteSchema),
    defaultValues: {
      firstName: "",
      lastName: "",
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = handleSubmit(async (values) => {
    try {
      const result = await platformInviteService.acceptInvite({
        token,
        firstName: values.firstName,
        lastName: values.lastName,
        password: values.password,
      });
      setKeepLoggedIn(true);
      setMember(result.member);
      setToken(result.token);
      setAccepted(true);
    } catch (error) {
      toast.error("Couldn't accept invite", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  });

  if (accepted) {
    return (
      <RouteTransition
        messages={["Setting up your account", "Preparing your dashboard"]}
        onComplete={() => {
          markAppIntroShown();
          router.push("/dashboard");
        }}
      />
    );
  }

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="space-y-4 text-center">
        <TriangleAlert
          className="mx-auto size-8 text-destructive"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {loadError ?? "This invite link is invalid or has expired."}
        </p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Back to login
        </Button>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="space-y-5">
      <div className="space-y-1.5 text-center">
        <p className="text-sm text-muted-foreground">
          You&apos;ve been invited as{" "}
          <span className="font-medium text-foreground">{invite.roleName}</span>
        </p>
        <p className="text-sm font-medium text-foreground">{invite.email}</p>
      </div>

      <motion.div
        custom={0}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="grid grid-cols-2 gap-3"
      >
        <div className="space-y-2">
          <Label htmlFor={firstNameId}>First Name</Label>
          <Input
            id={firstNameId}
            disabled={isSubmitting}
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
            disabled={isSubmitting}
            className="h-11"
            aria-invalid={!!errors.lastName}
            {...register("lastName")}
          />
          <FieldError message={errors.lastName?.message} />
        </div>
      </motion.div>

      <motion.div
        custom={1}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={passwordId}>Password</Label>
        <div className="relative">
          <Input
            id={passwordId}
            type={showPassword ? "text" : "password"}
            disabled={isSubmitting}
            aria-invalid={!!errors.password}
            className="h-11 pr-10"
            {...register("password")}
          />
          <button
            type="button"
            onClick={() => setShowPassword((value) => !value)}
            className="absolute inset-y-0 right-0 flex w-10 items-center justify-center text-muted-foreground transition-colors hover:text-foreground focus-visible:outline-none"
            aria-label={showPassword ? "Hide password" : "Show password"}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" aria-hidden="true" />
            ) : (
              <Eye className="size-4" aria-hidden="true" />
            )}
          </button>
        </div>
        <FieldError message={errors.password?.message} />
      </motion.div>

      <motion.div
        custom={2}
        initial="hidden"
        animate="visible"
        variants={fieldVariants}
        className="space-y-2"
      >
        <Label htmlFor={confirmPasswordId}>Confirm Password</Label>
        <Input
          id={confirmPasswordId}
          type={showPassword ? "text" : "password"}
          disabled={isSubmitting}
          aria-invalid={!!errors.confirmPassword}
          className="h-11"
          {...register("confirmPassword")}
        />
        <FieldError message={errors.confirmPassword?.message} />
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
          disabled={isSubmitting}
        >
          {isSubmitting ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Setting up…
            </>
          ) : (
            "Accept Invite"
          )}
        </Button>
      </motion.div>
    </form>
  );
}

function FieldError({ message }: { message?: string }) {
  return (
    <AnimatePresence initial={false}>
      {message ? (
        <motion.p
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
