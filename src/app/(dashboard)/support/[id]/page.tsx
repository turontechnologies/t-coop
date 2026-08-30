"use client";

import { use, useId, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2 } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { formatDateLong, getInitials } from "@/lib/format";
import { ticketStatusBadgeVariant } from "@/lib/support-data";
import { useAuthStore } from "@/store/auth.store";
import { useSupportStore } from "@/store/support.store";
import { cn } from "@/lib/utils";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const ticket = useSupportStore((state) =>
    state.tickets.find((t) => t.id === id),
  );
  const replyToTicket = useSupportStore((state) => state.replyToTicket);
  const escalateTicket = useSupportStore((state) => state.escalateTicket);
  const resolveTicket = useSupportStore((state) => state.resolveTicket);

  const [reply, setReply] = useState("");
  const [busy, setBusy] = useState(false);
  const replyId = useId();

  if (!member) return null;

  // Tenant isolation: a member only ever sees their own tickets, an admin only their own
  // co-op's, a super admin sees everything.
  const isOwnTicket = ticket?.raisedById === member.id;
  const isOwnCoopTicket =
    member.role === "admin" && ticket?.cooperativeId === member.id;
  const canView =
    !!ticket &&
    (member.role === "super_admin" || isOwnTicket || isOwnCoopTicket);

  if (!ticket || !canView) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that ticket.
        </p>
        <Button variant="outline" onClick={() => router.push("/support")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Support
        </Button>
      </div>
    );
  }

  // Who's currently responsible for resolving/escalating this ticket — only they get those
  // actions; the person who raised it can always reply, just never resolve their own issue.
  const isAssignee =
    (member.role === "admin" &&
      ticket.assignedToRole === "admin" &&
      isOwnCoopTicket) ||
    (member.role === "super_admin" && ticket.assignedToRole === "super_admin");
  const isOpen = ticket.status !== "Resolved";
  const canReply = isOpen && (isAssignee || isOwnTicket);
  const canResolve = isOpen && isAssignee;
  const canEscalate = isOpen && isAssignee && ticket.assignedToRole === "admin";

  const actorRole: "member" | "admin" | "super_admin" =
    member.role === "super_admin"
      ? "super_admin"
      : member.role === "admin"
        ? "admin"
        : "member";

  const handleReply = async () => {
    if (!reply.trim()) return;
    setBusy(true);
    replyToTicket(
      ticket.id,
      { actorId: member.id, actorName: member.name, actorRole },
      reply.trim(),
    );
    setReply("");
    setBusy(false);
    toast.success("Reply sent");
  };

  const handleResolve = async (resolutionNote: string) => {
    resolveTicket(
      ticket.id,
      { actorId: member.id, actorName: member.name, actorRole },
      resolutionNote,
    );
    toast.success("Ticket resolved", {
      description: `${ticket.raisedByName} will be notified.`,
    });
  };

  const handleEscalate = async (note: string) => {
    escalateTicket(
      ticket.id,
      { actorId: member.id, actorName: member.name, actorRole },
      note || undefined,
    );
    toast.success("Escalated to the super admin");
  };

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/support")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <Card>
        <CardHeader className="flex-row flex-wrap items-start justify-between gap-3 space-y-0">
          <div className="space-y-1">
            <CardTitle>{ticket.subject}</CardTitle>
            <p className="text-xs text-muted-foreground">
              {ticket.category} · Raised by {ticket.raisedByName} (
              {ticket.raisedByRole === "admin" ? "Admin" : "Member"}) ·{" "}
              {ticket.cooperativeName} ·{" "}
              {formatDateLong(new Date(ticket.createdAt))}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Badge
              variant={ticketStatusBadgeVariant(ticket.status)}
              className={cn(
                ticket.status === "Resolved" && "bg-success/15 text-success",
              )}
            >
              {ticket.status}
            </Badge>
            {canEscalate ? (
              <EscalateDialog busy={busy} onConfirm={handleEscalate} />
            ) : null}
            {canResolve ? (
              <ResolveDialog busy={busy} onConfirm={handleResolve} />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {ticket.timeline.map((event) => (
              <div key={event.id} className="flex items-start gap-3">
                <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
                  {getInitials(event.actorName)}
                </span>
                <div className="min-w-0 flex-1 space-y-0.5">
                  <div className="flex flex-wrap items-center gap-2">
                    <p className="text-sm font-semibold text-foreground">
                      {event.actorName}
                    </p>
                    <EventLabel type={event.type} />
                    <p className="text-xs text-muted-foreground">
                      {formatDateLong(new Date(event.createdAt))}
                    </p>
                  </div>
                  {event.message ? (
                    <p className="text-sm text-muted-foreground">
                      {event.message}
                    </p>
                  ) : null}
                </div>
              </div>
            ))}
          </div>

          {canReply ? (
            <div className="space-y-2 border-t border-border pt-4">
              <Label htmlFor={replyId}>Reply</Label>
              <Textarea
                id={replyId}
                rows={3}
                placeholder="Write a reply…"
                value={reply}
                onChange={(event) => setReply(event.target.value)}
                disabled={busy}
              />
              <div className="flex justify-end">
                <Button
                  type="button"
                  size="sm"
                  disabled={busy || !reply.trim()}
                  onClick={handleReply}
                >
                  {busy ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    "Send Reply"
                  )}
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function EventLabel({ type }: { type: string }) {
  if (type === "Raised") return null;
  const label =
    type === "Escalated"
      ? "escalated this"
      : type === "Resolved"
        ? "resolved this"
        : "replied";
  return <span className="text-xs text-muted-foreground">{label}</span>;
}

function ResolveDialog({
  busy,
  onConfirm,
}: {
  busy: boolean;
  onConfirm: (note: string) => Promise<void> | void;
}) {
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setNote("");
    setOpen(next);
  };

  const handleConfirm = async () => {
    await onConfirm(note.trim() || "Resolved.");
    handleOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger render={<Button type="button" size="sm" />}>
        Resolve
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Resolve this ticket?</AlertDialogTitle>
          <AlertDialogDescription>
            The person who raised it will be notified it&apos;s resolved.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={noteId}>Resolution note (optional)</Label>
          <Textarea
            id={noteId}
            rows={3}
            placeholder="What was done to resolve this?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={busy}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleConfirm}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Resolve"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

function EscalateDialog({
  busy,
  onConfirm,
}: {
  busy: boolean;
  onConfirm: (note: string) => Promise<void> | void;
}) {
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setNote("");
    setOpen(next);
  };

  const handleConfirm = async () => {
    await onConfirm(note.trim());
    handleOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant="outline" size="sm" />}
      >
        Escalate
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>Escalate to the super admin?</AlertDialogTitle>
          <AlertDialogDescription>
            This forwards the ticket (with its full history) to the platform
            team — you&apos;ll no longer be able to resolve it yourself.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={noteId}>Note for the super admin (optional)</Label>
          <Textarea
            id={noteId}
            rows={3}
            placeholder="Why does this need platform-level attention?"
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={busy}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction disabled={busy} onClick={handleConfirm}>
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              "Escalate"
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
