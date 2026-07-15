import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = {
  title: "Register Co-operative | T-Cooperative",
  description: "Register your co-operative on the T-Cooperative platform.",
};

export default function RegisterPage() {
  return <RegisterForm />;
}
