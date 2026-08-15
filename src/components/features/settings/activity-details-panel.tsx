"use client";

import { useState } from "react";
import { Check, Copy, MapPin, ShieldCheck } from "lucide-react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import {
  getActionIcon,
  getModuleIcon,
  getStatusMessage,
  getStatusStyle,
} from "@/lib/audit-log-ui";
import { formatDateTime, getInitials } from "@/lib/format";
import type { AuditLogEntry } from "@/lib/audit-log-data";
import { cn } from "@/lib/utils";

interface ActivityDetailsPanelProps {
  entry: AuditLogEntry | null;
  onOpenChange: (open: boolean) => void;
}

export function ActivityDetailsPanel({
  entry,
  onOpenChange,
}: ActivityDetailsPanelProps) {
  const [copied, setCopied] = useState(false);

  if (!entry) return null;

  const statusStyle = getStatusStyle(entry.status);
  const StatusIcon = statusStyle.icon;
  const ModuleIcon = getModuleIcon(entry.module);
  const ActionIcon = getActionIcon(entry.action);

  const handleCopyId = () => {
    navigator.clipboard.writeText(entry.id).then(() => {
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    });
  };

  return (
    <Sheet open={!!entry} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader>
          <div className="flex items-center gap-2">
            <span className="flex size-8 items-center justify-center rounded-full bg-primary/10 text-primary">
              <ShieldCheck className="size-4" aria-hidden="true" />
            </span>
            <SheetTitle>Activity Details</SheetTitle>
          </div>
          <SheetDescription>
            Complete information about this activity
          </SheetDescription>
        </SheetHeader>

        <div
          className={cn(
            "mb-6 flex items-start gap-3 rounded-xl p-3 ring-1",
            statusStyle.bannerClassName,
          )}
        >
          <StatusIcon className="size-5 shrink-0" aria-hidden="true" />
          <div className="space-y-0.5">
            <p className="text-sm font-semibold">
              {entry.status === "Success"
                ? "Successful Operation"
                : entry.status === "Failed"
                  ? "Operation Failed"
                  : entry.status === "Warning"
                    ? "Flagged Operation"
                    : "Informational"}
            </p>
            <p className="text-xs opacity-90">
              {getStatusMessage(entry.status)}
            </p>
          </div>
        </div>

        <dl className="space-y-4 text-sm">
          <Field label="Event ID">
            <div className="flex items-center gap-1.5">
              <span className="font-mono text-foreground">
                #{entry.id.slice(0, 12)}
              </span>
              <button
                type="button"
                onClick={handleCopyId}
                className="text-muted-foreground transition-colors hover:text-foreground"
                aria-label="Copy event ID"
              >
                {copied ? (
                  <Check className="size-3.5 text-success" aria-hidden="true" />
                ) : (
                  <Copy className="size-3.5" aria-hidden="true" />
                )}
              </button>
            </div>
          </Field>

          <Field label="Time">
            <span className="text-foreground">
              {formatDateTime(entry.date)}
            </span>
          </Field>

          <Field label="User">
            <div className="flex items-center gap-2">
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground">
                {getInitials(entry.activityBy)}
              </span>
              <span className="text-foreground">{entry.activityBy}</span>
            </div>
          </Field>

          <Field label="Role">
            <span className="text-foreground">{entry.role}</span>
          </Field>

          <Field label="Action">
            <span className="flex items-center gap-1.5 text-foreground">
              <ActionIcon
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {entry.action}
            </span>
          </Field>

          <Field label="Module">
            <span className="flex items-center gap-1.5 text-foreground">
              <ModuleIcon
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {entry.module}
            </span>
          </Field>

          <Field label="Resource">
            <span className="text-foreground">{entry.resource}</span>
          </Field>

          <Field label="Status">
            <span
              className={cn(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                statusStyle.badgeClassName,
              )}
            >
              <StatusIcon className="size-3" aria-hidden="true" />
              {entry.status}
            </span>
          </Field>

          <Field label="IP Address">
            <span className="font-mono text-foreground">{entry.ipAddress}</span>
          </Field>

          <Field label="Location">
            <span className="flex items-center gap-1.5 text-foreground">
              <MapPin
                className="size-3.5 text-muted-foreground"
                aria-hidden="true"
              />
              {entry.location}
            </span>
          </Field>
        </dl>
      </SheetContent>
    </Sheet>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center justify-between gap-3 border-b border-border pb-3 last:border-0 last:pb-0">
      <dt className="text-xs text-muted-foreground">{label}</dt>
      <dd>{children}</dd>
    </div>
  );
}
