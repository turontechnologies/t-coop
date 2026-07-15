"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { CreateNewPasswordForm } from "@/components/features/auth/create-new-password-form";
import { usePasswordResetStore } from "@/store/password-reset.store";

export default function CreateNewPasswordPage() {
  const router = useRouter();
  const member = usePasswordResetStore((state) => state.member);

  useEffect(() => {
    if (!member) {
      router.replace("/forgot-password");
    }
  }, [member, router]);

  if (!member) return null;

  return <CreateNewPasswordForm />;
}
