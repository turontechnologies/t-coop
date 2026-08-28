"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { BadgeCheck, Loader2, TriangleAlert, XCircle } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  guarantorInviteService,
  type GuarantorInviteInfo,
} from "@/services/guarantor-invite.service";

interface GuarantorInviteResponseProps {
  token: string;
}

export function GuarantorInviteResponse({
  token,
}: GuarantorInviteResponseProps) {
  const router = useRouter();
  const [invite, setInvite] = useState<GuarantorInviteInfo | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [checking, setChecking] = useState(true);
  const [responding, setResponding] = useState<"Accepted" | "Declined" | null>(
    null,
  );

  useEffect(() => {
    if (!token) {
      setLoadError("This invite link is missing its token.");
      setChecking(false);
      return;
    }
    guarantorInviteService
      .getInvite(token)
      .then(setInvite)
      .catch((error) => {
        setLoadError(
          error instanceof Error
            ? error.message
            : "This invite link is invalid or has expired.",
        );
      })
      .finally(() => setChecking(false));
  }, [token]);

  const respond = async (action: "Accepted" | "Declined") => {
    setResponding(action);
    try {
      const result =
        action === "Accepted"
          ? await guarantorInviteService.accept(token)
          : await guarantorInviteService.decline(token);
      setInvite((current) =>
        current
          ? {
              ...current,
              status: result.status as GuarantorInviteInfo["status"],
            }
          : current,
      );
    } catch (error) {
      toast.error("Couldn't record your response", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setResponding(null);
    }
  };

  if (checking) {
    return (
      <div className="flex justify-center py-8">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (loadError || !invite) {
    return (
      <div className="space-y-4 text-center">
        <TriangleAlert
          className="mx-auto size-8 text-destructive"
          aria-hidden="true"
        />
        <p className="text-sm text-muted-foreground">
          {loadError ?? "This invite link is invalid or has expired."}
        </p>
        <Button variant="outline" onClick={() => router.push("/login")}>
          Back to login
        </Button>
      </div>
    );
  }

  if (invite.status === "Accepted") {
    return (
      <div className="space-y-3 text-center">
        <BadgeCheck
          className="mx-auto size-8 text-success"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          You&apos;ve accepted this guarantor request.
        </p>
        <p className="text-sm text-muted-foreground">
          Thanks, {invite.guarantorName} — {invite.memberName} has been
          notified.
        </p>
      </div>
    );
  }

  if (invite.status === "Declined") {
    return (
      <div className="space-y-3 text-center">
        <XCircle
          className="mx-auto size-8 text-destructive"
          aria-hidden="true"
        />
        <p className="text-sm font-medium text-foreground">
          You&apos;ve declined this guarantor request.
        </p>
        <p className="text-sm text-muted-foreground">
          {invite.memberName} will need to find another guarantor.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-6 text-center">
      <div className="space-y-1.5">
        <p className="text-sm text-muted-foreground">
          Hi {invite.guarantorName},
        </p>
        <p className="text-base font-medium text-foreground">
          <span className="font-semibold">{invite.memberName}</span> named you
          as a guarantor while joining{" "}
          <span className="font-semibold">{invite.cooperativeName}</span> on
          T-Cooperative.
        </p>
        <p className="text-sm text-muted-foreground">
          Do you accept being their guarantor?
        </p>
      </div>
      <div className="flex flex-col gap-3 sm:flex-row sm:justify-center">
        <Button
          variant="outline"
          className="border-destructive/40 text-destructive hover:bg-destructive/10"
          disabled={responding !== null}
          onClick={() => respond("Declined")}
        >
          {responding === "Declined" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            "Decline"
          )}
        </Button>
        <Button
          disabled={responding !== null}
          onClick={() => respond("Accepted")}
        >
          {responding === "Accepted" ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            "Accept"
          )}
        </Button>
      </div>
    </div>
  );
}
