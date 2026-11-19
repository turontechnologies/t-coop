"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Check, Loader2, UserRound, Users, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { membershipAdminService } from "@/services/membership.service";

/** "Do you know this person?" — shown to a member named as guarantor on an application to join. */
export function VouchRequestsCard() {
  const queryClient = useQueryClient();
  const { data = [] } = useQuery({
    queryKey: ["membership-vouches"],
    queryFn: () => membershipAdminService.vouches(),
  });
  const [busy, setBusy] = useState<string | null>(null);

  if (data.length === 0) return null;

  const answer = async (id: string, knowsThem: boolean, name: string) => {
    setBusy(id);
    try {
      await membershipAdminService.answerVouch(id, knowsThem);
      toast.success(
        knowsThem
          ? `Thank you. You stand for ${name}.`
          : "Thank you. We told the co-operative.",
      );
      await queryClient.invalidateQueries({ queryKey: ["membership-vouches"] });
    } catch (error) {
      toast.error("Couldn't send your answer", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setBusy(null);
    }
  };

  return (
    <section className="space-y-3 rounded-2xl bg-amber-500/10 p-4 ring-1 ring-amber-500/30 sm:p-5">
      <div className="flex items-center gap-2">
        <Users
          className="size-5 text-amber-700 dark:text-amber-300"
          aria-hidden="true"
        />
        <h3 className="text-sm font-semibold text-foreground">
          {data.length === 1
            ? "Someone named you as their guarantor"
            : `${data.length} people named you as their guarantor`}
        </h3>
      </div>
      <ul className="space-y-2">
        {data.map((request) => (
          <li
            key={request.id}
            className="flex flex-col gap-3 rounded-xl bg-card p-3 sm:flex-row sm:items-center"
          >
            <div className="flex min-w-0 flex-1 items-center gap-3">
              {request.applicantPhotoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={request.applicantPhotoUrl}
                  alt=""
                  className="size-11 shrink-0 rounded-full bg-muted object-cover"
                />
              ) : (
                <span className="flex size-11 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                  <UserRound className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0">
                <p className="text-sm font-medium text-foreground">
                  Do you know {request.applicantName}?
                </p>
                <p className="text-xs text-muted-foreground">
                  They applied to join {request.cooperativeName} and named you
                  as their guarantor. Phone {request.applicantPhone}.
                </p>
              </div>
            </div>
            <div className="flex shrink-0 gap-2">
              <Button
                size="sm"
                disabled={busy === request.id}
                onClick={() => answer(request.id, true, request.applicantName)}
              >
                {busy === request.id ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Check className="size-4" aria-hidden="true" />
                )}
                Yes, I stand for them
              </Button>
              <Button
                size="sm"
                variant="outline"
                disabled={busy === request.id}
                onClick={() => answer(request.id, false, request.applicantName)}
              >
                <X className="size-4" aria-hidden="true" />
                No
              </Button>
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
