"use client";

import { useState } from "react";
import { ChevronDown } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const PERIODS = ["Last 7 days", "Last 30 days", "Last 90 days"] as const;

interface DashboardBreadcrumbProps {
  roleLabel: string;
  page: string;
}

export function DashboardBreadcrumb({
  roleLabel,
  page,
}: DashboardBreadcrumbProps) {
  const [period, setPeriod] =
    useState<(typeof PERIODS)[number]>("Last 30 days");

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-4 py-4 sm:px-6">
      <p className="text-sm">
        <span className="font-semibold text-foreground">{roleLabel}</span>
        <span className="mx-1.5 text-muted-foreground">/</span>
        <span className="text-muted-foreground">{page}</span>
      </p>

      <DropdownMenu>
        <DropdownMenuTrigger
          render={
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-lg border border-border bg-card px-3 py-1.5 text-sm font-medium text-foreground outline-none hover:bg-muted focus-visible:bg-muted"
            />
          }
        >
          Showing: {period}
          <ChevronDown
            className="size-3.5 text-muted-foreground"
            aria-hidden="true"
          />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          {PERIODS.map((option) => (
            <DropdownMenuItem key={option} onClick={() => setPeriod(option)}>
              {option}
            </DropdownMenuItem>
          ))}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
