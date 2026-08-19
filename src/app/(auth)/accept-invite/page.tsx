import type { Metadata } from "next";
import { Suspense } from "react";
import { AcceptInviteForm } from "@/components/features/auth/accept-invite-form";

export const metadata: Metadata = {
  title: "Accept Invite | T-Cooperative",
  description:
    "Accept your invitation to join T-Cooperative as platform staff.",
};

export default function AcceptInvitePage() {
  return (
    <div className="space-y-8">
      <div className="space-y-1.5 text-center">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground">
          You&apos;re invited
        </h2>
        <p className="text-sm text-muted-foreground">
          Set your password to finish joining T-Cooperative
        </p>
      </div>
      <Suspense fallback={null}>
        <AcceptInviteForm />
      </Suspense>
    </div>
  );
}
