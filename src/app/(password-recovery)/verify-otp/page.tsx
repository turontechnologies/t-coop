"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VerifyOtpForm } from "@/components/features/auth/verify-otp-form";
import { usePasswordResetStore } from "@/store/password-reset.store";

export default function VerifyOtpPage() {
  const router = useRouter();
  const email = usePasswordResetStore((state) => state.email);

  useEffect(() => {
    if (!email) {
      router.replace("/forgot-password");
    }
  }, [email, router]);

  if (!email) return null;

  return <VerifyOtpForm />;
}
