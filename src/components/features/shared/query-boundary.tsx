"use client";

import type { ReactNode } from "react";
import { TriangleAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";

interface QueryBoundaryProps {
  isLoading: boolean;
  isError: boolean;
  error: unknown;
  onRetry: () => void;
  isRetrying: boolean;
  loadingLabel?: string;
  errorTitle?: string;
  children: ReactNode;
}

/**
 * The loading-skeleton / retry-able-error-card pattern used by every
 * real-backend-backed panel (Profile, Dashboard, Logs, and now the
 * Settings tabs below) — pulled into one place once it started repeating
 * rather than copy-pasting the same three JSX blocks again.
 */
export function QueryBoundary({
  isLoading,
  isError,
  error,
  onRetry,
  isRetrying,
  errorTitle = "Couldn't load this section",
  children,
}: QueryBoundaryProps) {
  if (isLoading) {
    return (
      <div className="space-y-4">
        <div className="h-40 animate-pulse rounded-xl bg-muted" />
      </div>
    );
  }

  if (isError) {
    return (
      <Card>
        <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
          <TriangleAlert
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">{errorTitle}</p>
            <p className="text-sm text-muted-foreground">
              {error instanceof Error
                ? error.message
                : "Please check your connection and try again."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={onRetry}
            disabled={isRetrying}
          >
            {isRetrying ? "Retrying…" : "Try again"}
          </Button>
        </CardContent>
      </Card>
    );
  }

  return <>{children}</>;
}
