"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { Mail } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ForgotPasswordForm } from "@/components/features/auth/forgot-password-form";
import { usePasswordResetStore } from "@/store/password-reset.store";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const setEmail = usePasswordResetStore((state) => state.setEmail);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSent = (email: string) => {
    setEmail(email);
    setSentTo(email);
  };

  if (sentTo) {
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
            We&apos;ve sent a 6-digit code to{" "}
            <span className="font-medium text-foreground">{sentTo}</span>. It
            expires in 10 minutes — check your spam folder if it doesn&apos;t
            show up in a minute or two.
          </p>
        </div>

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
            onClick={() => setSentTo(null)}
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
