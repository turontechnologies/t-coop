"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { VerifyOtpForm } from "@/components/features/auth/verify-otp-form";
import { usePasswordResetStore } from "@/store/password-reset.store";

export default function VerifyOtpPage() {
  const router = useRouter();
  const otp = usePasswordResetStore((state) => state.otp);

  useEffect(() => {
    if (!otp) {
      router.replace("/forgot-password");
    }
  }, [otp, router]);

  if (!otp) return null;

  return <VerifyOtpForm />;
}
