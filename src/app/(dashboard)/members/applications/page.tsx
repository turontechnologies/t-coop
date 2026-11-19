"use client";

import { useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import {
  ArrowLeft,
  ChevronRight,
  Settings,
  UserRound,
  Users,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { ScorePill } from "@/components/features/members-directory/application-score";
import { useModuleAccess } from "@/hooks/use-permission";
import { formatTimeAgo } from "@/lib/format";
import { cn } from "@/lib/utils";
import { membershipAdminService } from "@/services/membership.service";
import { useAuthStore } from "@/store/auth.store";

const TABS = [
  { value: "Submitted", label: "Waiting" },
  { value: "Approved", label: "Approved" },
  { value: "Rejected", label: "Not approved" },
] as const;

type Tab = (typeof TABS)[number]["value"];

/** Everyone who applied to join, with how genuine their details look. */
export default function MembershipApplicationsPage() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.cooperativeId ?? member?.id ?? "";
  const access = useModuleAccess("Members Directory");
  const [tab, setTab] = useState<Tab>("Submitted");
  const {
    data = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useQuery({
    queryKey: ["membership-applications", coopId, tab],
    queryFn: () => membershipAdminService.list(coopId, tab),
    enabled: Boolean(coopId) && access !== null,
  });

  if (!member) return null;
  if (access === null) {
    return (
      <p className="pt-6 text-sm text-muted-foreground">
        Your role doesn&apos;t have access to Members Directory.
      </p>
    );
  }

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <Link
            href="/members"
            className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
          >
            <ArrowLeft className="size-4" aria-hidden="true" />
            Members Directory
          </Link>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            Applications to join
          </h1>
          <p className="text-sm text-muted-foreground">
            People who applied online and paid. Open one to see their details
            and checks, then approve or reject.
          </p>
        </div>
        {member.role === "admin" ? (
          <Button
            variant="outline"
            nativeButton={false}
            render={<Link href="/settings" />}
          >
            <Settings className="size-4" aria-hidden="true" />
            Joining settings
          </Button>
        ) : null}
      </div>

      <div className="inline-flex rounded-xl bg-muted p-1" role="tablist">
        {TABS.map((item) => (
          <button
            key={item.value}
            type="button"
            role="tab"
            aria-selected={tab === item.value}
            onClick={() => setTab(item.value)}
            className={cn(
              "rounded-lg px-4 py-1.5 text-sm font-medium transition",
              tab === item.value
                ? "bg-card text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground",
            )}
          >
            {item.label}
          </button>
        ))}
      </div>

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load the applications"
      >
        {data.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-12 text-center">
            <Users
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              {tab === "Submitted"
                ? "No one is waiting"
                : tab === "Approved"
                  ? "No approved applications yet"
                  : "No rejected applications"}
            </p>
            {tab === "Submitted" ? (
              <p className="mt-1 text-sm text-muted-foreground">
                Share your joining link from Settings → Co-operative Settings →
                New Members.
              </p>
            ) : null}
          </div>
        ) : (
          <ul className="space-y-2">
            {data.map((item) => (
              <li key={item.id}>
                <Link
                  href={`/members/applications/${item.id}`}
                  className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/70 transition hover:ring-primary/40"
                >
                  {item.photoUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.photoUrl}
                      alt=""
                      className="size-12 shrink-0 rounded-full bg-muted object-cover"
                    />
                  ) : (
                    <span className="flex size-12 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground">
                      <UserRound className="size-5" aria-hidden="true" />
                    </span>
                  )}
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium text-foreground">
                      {item.fullName}
                    </p>
                    <p className="truncate text-xs text-muted-foreground">
                      {item.reference} · {item.phone}
                      {item.submittedAt
                        ? ` · applied ${formatTimeAgo(item.submittedAt)}`
                        : ""}
                    </p>
                    <div className="mt-1.5 flex flex-wrap items-center gap-2">
                      <ScorePill
                        score={item.score}
                        level={item.level}
                        label={item.levelLabel}
                      />
                      {item.guarantorsAsked > 0 ? (
                        <span className="text-xs text-muted-foreground">
                          {item.guarantorsConfirmed} of {item.guarantorsAsked}{" "}
                          guarantors said yes
                        </span>
                      ) : null}
                      {item.memberId ? (
                        <span className="text-xs text-muted-foreground">
                          Now {item.memberId}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <ChevronRight
                    className="size-4 shrink-0 text-muted-foreground group-hover:text-primary"
                    aria-hidden="true"
                  />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </QueryBoundary>
    </div>
  );
}
