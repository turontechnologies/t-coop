"use client";

import { useId, useState, type ReactNode } from "react";
import Link from "next/link";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  ArrowLeft,
  CheckCircle2,
  Clock,
  ExternalLink,
  FileText,
  Loader2,
  ShieldCheck,
  UserRound,
  XCircle,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import {
  CheckList,
  ScoreRing,
} from "@/components/features/members-directory/application-score";
import { useCurrency } from "@/components/providers/currency-provider";
import { useModuleAccess } from "@/hooks/use-permission";
import { formatDateLong, formatDateTime, formatMoney } from "@/lib/format";
import { cn } from "@/lib/utils";
import {
  membershipAdminService,
  type ApplicationDetail,
} from "@/services/membership.service";
import { useAuthStore } from "@/store/auth.store";

const GUARANTOR_LOOK = {
  Confirmed: {
    text: "Said yes",
    tone: "text-primary dark:text-emerald-300",
    icon: CheckCircle2,
  },
  Declined: { text: "Said no", tone: "text-destructive", icon: XCircle },
  Pending: {
    text: "Not answered yet",
    tone: "text-amber-600 dark:text-amber-300",
    icon: Clock,
  },
  NotAsked: {
    text: "From outside (not asked in the app)",
    tone: "text-muted-foreground",
    icon: UserRound,
  },
} as const;

function Section({
  title,
  children,
  className,
}: {
  title: string;
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:p-6",
        className,
      )}
    >
      <h2 className="mb-3 text-base font-semibold text-foreground">{title}</h2>
      {children}
    </section>
  );
}

function Row({ label, value }: { label: string; value: ReactNode }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:gap-4">
      <dt className="w-44 shrink-0 text-sm text-muted-foreground">{label}</dt>
      <dd className="min-w-0 text-sm break-words text-foreground">
        {value || (
          <span className="text-muted-foreground italic">Not given</span>
        )}
      </dd>
    </div>
  );
}

/** One application: the score and checks, every detail, and approve / reject. */
export function ApplicationReview({
  applicationId,
}: {
  applicationId: string;
}) {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.cooperativeId ?? member?.id ?? "";
  const access = useModuleAccess("Members Directory");
  const currency = useCurrency();
  const queryClient = useQueryClient();
  const queryKey = ["membership-application", coopId, applicationId];
  const { data, isLoading, isError, error, refetch, isRefetching } = useQuery({
    queryKey,
    queryFn: () => membershipAdminService.detail(coopId, applicationId),
    enabled: Boolean(coopId),
  });
  const [dialog, setDialog] = useState<"approve" | "reject" | null>(null);

  const onDecided = (result: ApplicationDetail) => {
    queryClient.setQueryData(queryKey, result);
    void queryClient.invalidateQueries({
      queryKey: ["membership-applications", coopId],
    });
    void queryClient.invalidateQueries({ queryKey: ["coop-members"] });
    setDialog(null);
  };

  const money = (amount: number | null | undefined) =>
    formatMoney(amount ?? 0, currency);

  return (
    <div className="space-y-6 pt-6">
      <Link
        href="/members/applications"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        All applications
      </Link>
      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load this application"
      >
        {data ? (
          <ReviewBody
            data={data}
            money={money}
            canDecide={
              access === "write" && data.application.status === "Submitted"
            }
            onApprove={() => setDialog("approve")}
            onReject={() => setDialog("reject")}
          />
        ) : null}
      </QueryBoundary>

      {data ? (
        <>
          <ApproveDialog
            open={dialog === "approve"}
            onOpenChange={(open) => setDialog(open ? "approve" : null)}
            coopId={coopId}
            data={data}
            money={money}
            onDone={onDecided}
          />
          <RejectDialog
            open={dialog === "reject"}
            onOpenChange={(open) => setDialog(open ? "reject" : null)}
            coopId={coopId}
            data={data}
            money={money}
            onDone={onDecided}
          />
        </>
      ) : null}
    </div>
  );
}

function ReviewBody({
  data,
  money,
  canDecide,
  onApprove,
  onReject,
}: {
  data: ApplicationDetail;
  money: (amount: number | null | undefined) => string;
  canDecide: boolean;
  onApprove: () => void;
  onReject: () => void;
}) {
  const app = data.application;
  const fullName = [app.firstName, app.otherName, app.lastName]
    .filter(Boolean)
    .join(" ");
  const { checks } = data;
  const problems = checks.checks.filter((c) => c.status === "fail").length;
  const warnings = checks.checks.filter((c) => c.status === "warn").length;

  return (
    <div className="space-y-6">
      <section className="flex flex-col gap-5 rounded-3xl bg-card p-5 shadow-card ring-1 ring-border/70 sm:flex-row sm:items-center sm:p-6">
        {app.photoUrl ? (
          <a
            href={app.photoUrl}
            target="_blank"
            rel="noreferrer"
            className="shrink-0"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={app.photoUrl}
              alt={`Photo of ${fullName}`}
              className="size-24 rounded-2xl bg-muted object-cover"
            />
          </a>
        ) : (
          <span className="flex size-24 shrink-0 items-center justify-center rounded-2xl bg-muted text-muted-foreground">
            <UserRound className="size-8" aria-hidden="true" />
          </span>
        )}
        <div className="min-w-0 flex-1 space-y-1">
          <p className="font-mono text-xs text-muted-foreground">
            {app.reference}
          </p>
          <h1 className="text-2xl font-semibold tracking-tight text-foreground">
            {fullName}
          </h1>
          <p className="text-sm text-muted-foreground">
            {app.email} · {app.phone}
          </p>
          <p className="text-xs text-muted-foreground">
            {app.submittedAt
              ? `Applied ${formatDateTime(app.submittedAt)}`
              : ""}
            {data.amountPaid ? ` · Paid ${money(data.amountPaid)}` : ""}
          </p>
          <StatusLine data={data} />
        </div>
        {canDecide ? (
          <div className="flex shrink-0 gap-2 sm:flex-col">
            <Button onClick={onApprove}>
              <CheckCircle2 className="size-4" aria-hidden="true" />
              Approve
            </Button>
            <Button
              variant="outline"
              onClick={onReject}
              className="text-destructive"
            >
              <XCircle className="size-4" aria-hidden="true" />
              Reject
            </Button>
          </div>
        ) : null}
      </section>

      <Section title="How genuine does this look?">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start">
          <div className="flex flex-col items-center gap-2 sm:w-44">
            <ScoreRing score={checks.score} level={checks.level} />
            <p className="text-sm font-semibold text-foreground">
              {checks.levelLabel}
            </p>
            <p className="text-center text-xs text-muted-foreground">
              {problems === 0 && warnings === 0
                ? "Every check passed."
                : `${problems ? `${problems} problem${problems === 1 ? "" : "s"}` : ""}${problems && warnings ? ", " : ""}${warnings ? `${warnings} to look at` : ""}`}
            </p>
          </div>
          <div className="min-w-0 flex-1">
            <CheckList checks={checks.checks} />
            <p className="mt-3 flex items-start gap-2 rounded-xl bg-muted/60 px-3 py-2 text-xs text-muted-foreground">
              <ShieldCheck
                className="mt-0.5 size-4 shrink-0"
                aria-hidden="true"
              />
              These checks help you decide; they are not the final word. The NIN
              is checked for its shape and for being used by someone else, not
              with the government. Compare the photo and NIN with the ID card
              yourself.
            </p>
          </div>
        </div>
      </Section>

      <div className="grid gap-6 lg:grid-cols-2">
        <Section title="Personal details">
          <dl className="divide-y divide-border">
            <Row label="Full name" value={fullName} />
            <Row label="Male or female" value={app.gender} />
            <Row
              label="Date of birth"
              value={
                app.dateOfBirth
                  ? formatDateLong(new Date(`${app.dateOfBirth}T00:00:00`))
                  : null
              }
            />
            <Row
              label="NIN"
              value={
                app.nin ? <span className="font-mono">{app.nin}</span> : null
              }
            />
            <Row label="Work" value={app.occupation} />
            <Row
              label="Home address"
              value={[app.homeAddress, app.city, app.state, app.country]
                .filter(Boolean)
                .join(", ")}
            />
          </dl>
        </Section>

        <Section title="Documents">
          <div className="grid gap-3 sm:grid-cols-2">
            <DocumentTile label="Passport photo" url={app.photoUrl} />
            <DocumentTile
              label={app.idDocumentType ?? "ID card"}
              url={app.idDocumentUrl}
            />
          </div>
        </Section>

        <Section title="Guarantors">
          {app.guarantors.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No guarantor was given.
            </p>
          ) : (
            <ul className="divide-y divide-border">
              {app.guarantors.map((g) => {
                const look = GUARANTOR_LOOK[g.status];
                return (
                  <li key={g.id} className="flex items-center gap-3 py-2.5">
                    <look.icon
                      className={cn("size-5 shrink-0", look.tone)}
                      aria-hidden="true"
                    />
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium text-foreground">
                        {g.memberId ? (
                          <Link
                            href={`/members/${g.memberId}`}
                            className="hover:underline"
                          >
                            {g.name}
                          </Link>
                        ) : (
                          g.name
                        )}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {g.memberId ? `Member ${g.memberId}` : g.phone}
                        {g.respondedAt
                          ? ` · answered ${formatDateTime(g.respondedAt)}`
                          : ""}
                      </p>
                    </div>
                    <span className={cn("text-xs font-medium", look.tone)}>
                      {look.text}
                    </span>
                  </li>
                );
              })}
            </ul>
          )}
        </Section>

        <Section title="Next of kin and bank">
          <dl className="divide-y divide-border">
            <Row label="Next of kin" value={app.nextOfKinName} />
            <Row label="Their phone" value={app.nextOfKinPhone} />
            <Row label="Relationship" value={app.nextOfKinRelationship} />
            <Row label="Account number" value={app.accountNumber} />
            <Row label="Name the bank gave" value={data.bankAccountName} />
          </dl>
        </Section>

        <Section title="Payment" className="lg:col-span-2">
          <dl className="grid gap-x-6 sm:grid-cols-2">
            <Row label="Form fee" value={money(app.formFee)} />
            <Row
              label="First savings"
              value={`${money(app.firstSavings)}${data.savingsTypeName ? ` → ${data.savingsTypeName}` : ""}`}
            />
            <Row
              label="Amount paid"
              value={data.amountPaid != null ? money(data.amountPaid) : null}
            />
            <Row
              label="Paid on"
              value={data.paidAt ? formatDateTime(data.paidAt) : null}
            />
            <Row label="Paid through" value={data.paymentGateway} />
            <Row
              label="Payment reference"
              value={
                data.paymentReference ? (
                  <span className="font-mono text-xs">
                    {data.paymentReference}
                  </span>
                ) : null
              }
            />
          </dl>
        </Section>
      </div>
    </div>
  );
}

function StatusLine({ data }: { data: ApplicationDetail }) {
  const app = data.application;
  if (app.status === "Approved") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 pt-1 text-sm text-primary dark:text-emerald-300">
        <CheckCircle2 className="size-4" aria-hidden="true" />
        Approved{data.decidedBy ? ` by ${data.decidedBy}` : ""}
        {data.decidedAt
          ? ` on ${formatDateLong(new Date(data.decidedAt))}`
          : ""}
        .
        {data.memberId ? (
          <Link
            href={`/members/${data.memberId}`}
            className="font-semibold underline"
          >
            Now member {data.memberId}
          </Link>
        ) : null}
      </p>
    );
  }
  if (app.status === "Rejected") {
    return (
      <p className="flex flex-wrap items-center gap-1.5 pt-1 text-sm text-destructive">
        <XCircle className="size-4" aria-hidden="true" />
        Not approved{data.decidedBy ? ` by ${data.decidedBy}` : ""}. Reason:{" "}
        {data.decisionNote}
      </p>
    );
  }
  return (
    <p className="flex items-center gap-1.5 pt-1 text-sm text-amber-700 dark:text-amber-300">
      <Clock className="size-4" aria-hidden="true" />
      Waiting for your decision
    </p>
  );
}

function DocumentTile({ label, url }: { label: string; url: string | null }) {
  if (!url) {
    return (
      <div className="flex h-40 flex-col items-center justify-center gap-1 rounded-2xl border border-dashed border-border text-center text-sm text-muted-foreground">
        <FileText className="size-6" aria-hidden="true" />
        {label}: not added
      </div>
    );
  }
  const pdf = url.toLowerCase().endsWith(".pdf");
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="group relative block overflow-hidden rounded-2xl bg-muted ring-1 ring-border/70"
    >
      {pdf ? (
        <div className="flex h-40 flex-col items-center justify-center gap-1 text-sm text-foreground">
          <FileText className="size-8" aria-hidden="true" />
          PDF file
        </div>
      ) : (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={url} alt={label} className="h-40 w-full object-cover" />
      )}
      <span className="absolute inset-x-0 bottom-0 flex items-center justify-between bg-black/55 px-3 py-1.5 text-xs text-white">
        {label}
        <ExternalLink className="size-3.5" aria-hidden="true" />
      </span>
    </a>
  );
}

function ApproveDialog({
  open,
  onOpenChange,
  coopId,
  data,
  money,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string;
  data: ApplicationDetail;
  money: (amount: number | null | undefined) => string;
  onDone: (result: ApplicationDetail) => void;
}) {
  const id = useId();
  const [memberId, setMemberId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const approve = useMutation({
    mutationFn: () =>
      membershipAdminService.approve(coopId, data.application.id, {
        membershipId: (memberId ?? data.nextMemberId ?? "").trim() || null,
        note: note.trim() || null,
      }),
  });
  const app = data.application;
  const lowScore = data.checks.level !== "high";

  const submit = async () => {
    try {
      const result = await approve.mutateAsync();
      toast.success(`${app.firstName} is now a member`, {
        description: `Membership ID ${result.memberId}. Their login details were emailed to ${app.email}.`,
      });
      onDone(result);
    } catch (error) {
      toast.error("Couldn't approve", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !approve.isPending && onOpenChange(value)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>
            Approve {app.firstName} {app.lastName}?
          </DialogTitle>
          <DialogDescription>
            They become a member straight away and get an email with their
            Membership ID and password.
          </DialogDescription>
        </DialogHeader>
        <ul className="space-y-1.5 text-sm text-foreground">
          <li>• Their account is made with the details they gave.</li>
          {app.firstSavings > 0 ? (
            <li>
              • {money(app.firstSavings)} goes into their savings
              {data.savingsTypeName ? ` (${data.savingsTypeName})` : ""}.
            </li>
          ) : null}
          {app.guarantors.length ? (
            <li>• Their guarantors are saved on their record.</li>
          ) : null}
        </ul>
        {lowScore ? (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            The checks scored {data.checks.score}% (
            {data.checks.levelLabel.toLowerCase()}). You can still approve, but
            make sure you are happy with the problems listed.
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-mid`}>Membership ID</Label>
          <Input
            id={`${id}-mid`}
            value={memberId ?? data.nextMemberId ?? ""}
            onChange={(e) => setMemberId(e.target.value)}
          />
          <p className="text-xs text-muted-foreground">
            The next ID in your format. You can change it.
          </p>
        </div>
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-note`}>Note for your records (optional)</Label>
          <Textarea
            id={`${id}-note`}
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={approve.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button onClick={submit} disabled={approve.isPending}>
            {approve.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <CheckCircle2 className="size-4" aria-hidden="true" />
            )}
            Approve and send login details
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function RejectDialog({
  open,
  onOpenChange,
  coopId,
  data,
  money,
  onDone,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  coopId: string;
  data: ApplicationDetail;
  money: (amount: number | null | undefined) => string;
  onDone: (result: ApplicationDetail) => void;
}) {
  const id = useId();
  const [reason, setReason] = useState("");
  const reject = useMutation({
    mutationFn: () =>
      membershipAdminService.reject(coopId, data.application.id, reason.trim()),
  });
  const app = data.application;

  const submit = async () => {
    try {
      const result = await reject.mutateAsync();
      toast.success("Application rejected", {
        description: `We emailed ${app.email} with your reason.`,
      });
      onDone(result);
    } catch (error) {
      toast.error("Couldn't reject", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(value) => !reject.isPending && onOpenChange(value)}
    >
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Reject this application?</DialogTitle>
          <DialogDescription>
            We email {app.firstName} your reason. They can apply again later.
          </DialogDescription>
        </DialogHeader>
        {data.amountPaid ? (
          <p className="rounded-xl bg-amber-500/10 px-3 py-2 text-sm text-amber-800 dark:text-amber-300">
            They paid {money(data.amountPaid)}. The email asks them to contact
            you about it, so plan how you will handle any refund.
          </p>
        ) : null}
        <div className="space-y-1.5">
          <Label htmlFor={`${id}-reason`}>Reason</Label>
          <Textarea
            id={`${id}-reason`}
            rows={3}
            value={reason}
            onChange={(e) => setReason(e.target.value)}
            placeholder="e.g. The NIN on your form doesn't match your ID card."
          />
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            disabled={reject.isPending}
            onClick={() => onOpenChange(false)}
          >
            Cancel
          </Button>
          <Button
            variant="destructive"
            onClick={submit}
            disabled={reject.isPending || !reason.trim()}
          >
            {reject.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <XCircle className="size-4" aria-hidden="true" />
            )}
            Reject and tell them
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
