"use client";

import { useId, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { AnimatePresence, motion } from "framer-motion";
import { Loader2, TriangleAlert } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RouteTransition } from "@/components/brand/route-transition";
import { useForgotPassword } from "@/hooks/use-forgot-password";
import { usePasswordResetStore } from "@/store/password-reset.store";
import {
  verifyOtpSchema,
  type VerifyOtpFormValues,
} from "@/lib/validations/auth.schema";

export function VerifyOtpForm() {
  const otpInputId = useId();
  const router = useRouter();
  const [shakeKey, setShakeKey] = useState(0);
  const [verified, setVerified] = useState(false);

  const email = usePasswordResetStore((state) => state.email);
  const verifyOtp = usePasswordResetStore((state) => state.verifyOtp);
  const setResetSession = usePasswordResetStore(
    (state) => state.setResetSession,
  );
  const clearResetSession = usePasswordResetStore((state) => state.clear);
  const forgotPassword = useForgotPassword();

  const {
    register,
    handleSubmit,
    setError,
    formState: { errors, isSubmitting },
  } = useForm<VerifyOtpFormValues>({
    resolver: zodResolver(verifyOtpSchema),
    defaultValues: { otp: "" },
  });

  const onSubmit = handleSubmit((values) => {
    if (!verifyOtp(values.otp)) {
      setShakeKey((key) => key + 1);
      setError("otp", { message: "Incorrect OTP. Please try again." });
      return;
    }

    toast.success("Identity verified");
    setVerified(true);
  });

  const handleResend = async () => {
    if (!email) return;
    try {
      const response = await forgotPassword.mutateAsync({ email });
      setResetSession(email, response.otp, response.member);
      toast.success("A new OTP has been sent", {
        description: `Check the email preview sent to ${email}.`,
      });
    } catch (error) {
      toast.error("Couldn't resend OTP", {
        description: error instanceof Error ? error.message : undefined,
      });
    }
  };

  const busy = isSubmitting;

  if (verified) {
    return (
      <RouteTransition
        messages={["Identity verified", "Let's set a new password"]}
        onComplete={() => router.push("/create-new-password")}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="space-y-1.5 text-center">
        <h2 className="text-xl font-semibold tracking-tight text-foreground">
          O.T.P Verification
        </h2>
        <p className="text-sm text-muted-foreground">
          A one-time password has been sent to your registered email{" "}
          <span className="font-semibold text-foreground">{email}</span>
        </p>
      </div>

      <motion.form
        key={shakeKey}
        onSubmit={onSubmit}
        noValidate
        className="space-y-5"
        animate={shakeKey > 0 ? { x: [0, -8, 8, -6, 6, 0] } : undefined}
        transition={{ duration: 0.4 }}
      >
        <div className="space-y-2">
          <Label htmlFor={otpInputId}>One time password</Label>
          <Input
            id={otpInputId}
            inputMode="numeric"
            autoComplete="one-time-code"
            placeholder="Enter otp"
            disabled={busy}
            className="h-11 text-center text-lg tracking-[0.5em]"
            maxLength={6}
            aria-invalid={!!errors.otp}
            aria-describedby={errors.otp ? `${otpInputId}-error` : undefined}
            {...register("otp")}
          />
          <AnimatePresence initial={false}>
            {errors.otp?.message ? (
              <motion.p
                id={`${otpInputId}-error`}
                role="alert"
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: "auto" }}
                exit={{ opacity: 0, height: 0 }}
                transition={{ duration: 0.2 }}
                className="flex items-center justify-center gap-1.5 text-sm text-destructive"
              >
                <TriangleAlert
                  className="size-3.5 shrink-0"
                  aria-hidden="true"
                />
                {errors.otp.message}
              </motion.p>
            ) : null}
          </AnimatePresence>
        </div>

        <Button
          type="submit"
          className="h-11 w-full text-base"
          size="lg"
          disabled={busy}
        >
          {busy ? (
            <>
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
              Verifying…
            </>
          ) : (
            "Verify OTP"
          )}
        </Button>
      </motion.form>

      <div className="space-y-2 text-center text-sm">
        <p className="text-muted-foreground">
          Didn&apos;t get the code?{" "}
          <button
            type="button"
            onClick={handleResend}
            disabled={forgotPassword.isPending}
            className="font-semibold text-primary underline-offset-4 hover:underline focus-visible:underline disabled:opacity-50"
          >
            Resend OTP
          </button>
        </p>
        <Link
          href="/login"
          onClick={() => clearResetSession()}
          className="font-medium text-primary underline-offset-4 hover:underline focus-visible:underline"
        >
          Return to login
        </Link>
      </div>
    </div>
  );
}
