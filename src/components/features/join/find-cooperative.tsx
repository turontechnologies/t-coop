"use client";

import { useDeferredValue, useState } from "react";
import Link from "next/link";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Building2, Search, SearchCheck } from "lucide-react";
import { Input } from "@/components/ui/input";
import { joinService } from "@/services/membership.service";

/** Step 0: find the co-operative to join, by name or co-op ID. */
export function FindCooperative() {
  const [search, setSearch] = useState("");
  const query = useDeferredValue(search.trim());
  const {
    data: coops = [],
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["join-coops", query],
    queryFn: () => joinService.cooperatives(query),
  });

  return (
    <div className="space-y-8 pt-6">
      <div className="space-y-2 text-center">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground">
          Become a member
        </h1>
        <p className="mx-auto max-w-xl text-sm text-muted-foreground">
          Find your co-operative below. You will first see its rules and what
          you need to have ready, then fill in a short form and pay the joining
          fee. The co-operative checks your details before you become a member.
        </p>
      </div>

      <div className="relative mx-auto max-w-xl">
        <Search
          className="pointer-events-none absolute top-1/2 left-3.5 size-4 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Type the co-operative's name or ID"
          className="h-12 rounded-xl pl-10 text-base"
          aria-label="Search for a co-operative"
          autoFocus
        />
      </div>

      <div className="mx-auto max-w-xl space-y-3">
        {isLoading ? (
          Array.from({ length: 3 }).map((_, index) => (
            <div
              key={index}
              className="h-20 animate-pulse rounded-2xl bg-muted"
            />
          ))
        ) : isError ? (
          <p className="rounded-2xl bg-destructive/10 px-4 py-3 text-sm text-destructive">
            We couldn&apos;t load the list. Check your internet and try again.
          </p>
        ) : coops.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-border px-6 py-10 text-center">
            <Building2
              className="mx-auto size-8 text-muted-foreground"
              aria-hidden="true"
            />
            <p className="mt-3 text-sm font-medium text-foreground">
              {query
                ? `No co-operative called "${query}" is taking new members`
                : "No co-operative is taking new members right now"}
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Ask your co-operative for their joining link, or check the name.
            </p>
          </div>
        ) : (
          coops.map((coop) => (
            <Link
              key={coop.id}
              href={`/join/${encodeURIComponent(coop.id)}`}
              className="group flex items-center gap-4 rounded-2xl bg-card p-4 shadow-card ring-1 ring-border/70 transition hover:ring-primary/40"
            >
              {coop.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  src={coop.logoUrl}
                  alt=""
                  className="size-12 shrink-0 rounded-xl bg-muted object-cover"
                />
              ) : (
                <span className="flex size-12 shrink-0 items-center justify-center rounded-xl bg-primary/10 text-primary dark:text-emerald-300">
                  <Building2 className="size-5" aria-hidden="true" />
                </span>
              )}
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-foreground">
                  {coop.name}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {coop.id}
                  {coop.address ? ` · ${coop.address}` : ""}
                </p>
              </div>
              <ArrowRight
                className="size-4 shrink-0 text-muted-foreground transition group-hover:translate-x-0.5 group-hover:text-primary"
                aria-hidden="true"
              />
            </Link>
          ))
        )}
      </div>

      <Link
        href="/join/status"
        className="mx-auto flex max-w-xl items-center justify-center gap-2 text-sm font-medium text-primary hover:underline dark:text-emerald-300"
      >
        <SearchCheck className="size-4" aria-hidden="true" />
        Already applied? Check your application
      </Link>
    </div>
  );
}
