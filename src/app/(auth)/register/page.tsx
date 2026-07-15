import type { Metadata } from "next";
import { RegisterForm } from "@/components/features/auth/register-form";

export const metadata: Metadata = {
  title: "Register Co-operative | T-Cooperative",
  description: "Register your co-operative on the T-Cooperative platform.",
};

export default function RegisterPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Register Co-operative
        </h2>
        <p className="text-sm text-muted-foreground">Welcome to T-Coop</p>
      </div>
      <RegisterForm />
    </div>
  );
}
