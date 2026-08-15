"use client";

import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ProfileHeaderCard } from "@/components/features/profile/profile-header-card";
import { ProfileDetailsForm } from "@/components/features/profile/profile-details-form";
import { useProfile } from "@/hooks/use-profile";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const member = useAuthStore((state) => state.member);
  const {
    data: profile,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useProfile(member?.id);

  if (!member) return null;

  return (
    <div className="space-y-6 pt-6">
      <ProfileHeaderCard member={member} />

      {isLoading ? (
        <ProfileSkeleton />
      ) : isError ? (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <TriangleAlert
              className="size-6 text-destructive"
              aria-hidden="true"
            />
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">
                Couldn&apos;t load your profile
              </p>
              <p className="text-sm text-muted-foreground">
                {error instanceof Error
                  ? error.message
                  : "Please check your connection and try again."}
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={() => refetch()}
              disabled={isFetching}
            >
              {isFetching ? "Retrying…" : "Try again"}
            </Button>
          </CardContent>
        </Card>
      ) : profile ? (
        <ProfileDetailsForm memberId={member.id} profile={profile} />
      ) : null}
    </div>
  );
}

function ProfileSkeleton() {
  return (
    <div className="space-y-6">
      {Array.from({ length: 3 }).map((_, index) => (
        <div key={index} className="h-56 animate-pulse rounded-xl bg-muted" />
      ))}
    </div>
  );
}
