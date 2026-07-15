"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";
import { OtpEmailPreview } from "@/components/features/auth/otp-email-preview";
import { usePasswordResetStore } from "@/store/password-reset.store";
import type { AuthenticatedMember } from "@/types/auth";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const setResetSession = usePasswordResetStore(
    (state) => state.setResetSession,
  );
  const [sent, setSent] = useState<{
    email: string;
    otp: string;
    member: AuthenticatedMember;
  } | null>(null);

  const handleSent = (
    email: string,
    otp: string,
    member: AuthenticatedMember,
  ) => {
    setResetSession(email, otp, member);
    setSent({ email, otp, member });
  };

  if (sent) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: "easeOut" }}
        className="space-y-6"
      >
        <div className="space-y-1.5 text-center">
          <span className="mx-auto flex size-11 items-center justify-center rounded-full bg-accent text-accent-foreground">
            <Mail className="size-5" aria-hidden="true" />
          </span>
          <h2 className="text-xl font-semibold tracking-tight text-foreground">
            Check your email
          </h2>
          <p className="text-sm text-muted-foreground">
            Demo preview — here&apos;s a simulated look at the email we just
            sent to{" "}
            <span className="font-medium text-foreground">{sent.email}</span>.
          </p>
        </div>

        <OtpEmailPreview name={sent.member.name} otp={sent.otp} />

        <div className="space-y-2">
          <Button
            className="h-11 w-full text-base"
            size="lg"
            onClick={() => router.push("/verify-otp")}
          >
            Continue to verification
          </Button>
          <button
            type="button"
            onClick={() => setSent(null)}
            className="w-full text-center text-sm font-medium text-primary hover:underline"
          >
            Use a different email
          </button>
        </div>
      </motion.div>
    );
  }

  return <ForgotPasswordForm onSent={handleSent} />;
}
