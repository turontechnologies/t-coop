"use client";

import { useId, useState } from "react";
import {
  CheckCircle2,
  Clock,
  FileQuestion,
  Loader2,
  Search,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { formatDateLong } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  joinService,
  type ApplicationStatusView,
} from "@/services/membership.service";

const LOOK = {
  Draft: {
    icon: FileQuestion,
    label: "Not finished",
    tone: "bg-muted text-muted-foreground",
  },
  Submitted: {
    icon: Clock,
    label: "Being checked",
    tone: "bg-amber-500/15 text-amber-700 dark:text-amber-300",
  },
  Approved: {
    icon: CheckCircle2,
    label: "Approved",
    tone: "bg-primary/10 text-primary dark:text-emerald-300",
  },
  Rejected: {
    icon: XCircle,
    label: "Not approved",
    tone: "bg-destructive/10 text-destructive",
  },
} as const;

/** "Where is my application?" with the application number and email. */
export function ApplicationStatusCheck() {
  const id = useId();
  const [reference, setReference] = useState("");
  const [email, setEmail] = useState("");
  const [busy, setBusy] = useState(false);
  const [problem, setProblem] = useState<string | null>(null);
  const [result, setResult] = useState<ApplicationStatusView | null>(null);

  const check = async () => {
    if (!reference.trim() || !email.trim()) {
      setProblem("Enter your application number and your email address.");
      return;
    }
    setBusy(true);
    setProblem(null);
    setResult(null);
    try {
      setResult(await joinService.status(reference.trim(), email.trim()));
    } catch (error) {
      setProblem(
        error instanceof Error ? error.message : "We couldn't check right now.",
      );
    } finally {
      setBusy(false);
    }
  };

  const look = result ? LOOK[result.status] : null;

  return (
    <div className="mx-auto max-w-lg space-y-6 pt-8">
      <div className="space-y-1.5 text-center">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          Check my application
        </h1>
        <p className="text-sm text-muted-foreground">
          Use the application number we emailed you (it starts with APP-) and
          the email you applied with.
        </p>
      </div>
      <form
        className="space-y-4 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6"
        onSubmit={(event) => {
          event.preventDefault();
          void check();
        }}
      >
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-ref`}>Application number</Label>
          <Input
            id={`${id}-ref`}
            value={reference}
            onChange={(e) => setReference(e.target.value.toUpperCase())}
            placeholder="APP-XXXXXX"
            className="font-mono"
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-email`}>Email address</Label>
          <Input
            id={`${id}-email`}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
          />
        </div>
        {problem ? (
          <p className="rounded-xl bg-destructive/10 px-3 py-2 text-sm text-destructive">
            {problem}
          </p>
        ) : null}
        <Button type="submit" size="lg" className="w-full" disabled={busy}>
          {busy ? (
            <Loader2 className="size-4 animate-spin" aria-hidden="true" />
          ) : (
            <Search className="size-4" aria-hidden="true" />
          )}
          Check
        </Button>
      </form>

      {result && look ? (
        <section className="space-y-3 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6">
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="font-mono text-sm text-muted-foreground">
                {result.reference}
              </p>
              <p className="font-semibold text-foreground">
                {result.cooperativeName}
              </p>
            </div>
            <span
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-semibold",
                look.tone,
              )}
            >
              <look.icon className="size-3.5" aria-hidden="true" />
              {look.label}
            </span>
          </div>
          <p className="text-sm text-foreground">{result.message}</p>
          {result.note ? (
            <p className="rounded-xl bg-muted/60 px-3 py-2 text-sm text-foreground">
              Reason: {result.note}
            </p>
          ) : null}
          <p className="text-xs text-muted-foreground">
            {result.submittedAt
              ? `Sent on ${formatDateLong(new Date(result.submittedAt))}`
              : ""}
            {result.decidedAt
              ? ` · Decided on ${formatDateLong(new Date(result.decidedAt))}`
              : ""}
          </p>
        </section>
      ) : null}
    </div>
  );
}
