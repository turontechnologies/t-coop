"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateNewPasswordForm } from "@/components/features/auth/create-new-password-form";
import { usePasswordResetStore } from "@/store/password-reset.store";

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const resetToken = usePasswordResetStore((state) => state.resetToken);

  useEffect(() => {
    if (!resetToken) {
      router.replace("/forgot-password");
    }
  }, [resetToken, router]);

  if (!resetToken) return null;

  return <CreateNewPasswordForm />;
}
