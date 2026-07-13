import type { Metadata } from "next";
import { LoginForm } from "@/components/features/auth/login-form";

export const metadata: Metadata = {
  title: "Sign in | T-Cooperative",
  description: "Sign in to your T-Cooperative membership account.",
};

export default function LoginPage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          Sign in
        </h2>
        <p className="text-sm text-muted-foreground">Welcome back to T-Coop</p>
      </div>
      <LoginForm />
    </div>
  );
}
