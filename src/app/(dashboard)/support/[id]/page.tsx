"use client";

import { use, useId, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Loader2, Paperclip, X } from "lucide-react";
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
import { MAX_ATTACHMENT_BYTES } from "@/lib/file-to-data-url";
import { ticketStatusBadgeVariant, type TicketEvent } from "@/lib/support-data";
import {
  useCloseTicket,
  useEscalateTicket,
  useReopenTicket,
  useReplyToTicket,
  useResolveTicket,
  useSupportTicket,
} from "@/hooks/use-support";
import { uploadService } from "@/services/upload.service";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface TicketDetailPageProps {
  params: Promise<{ id: string }>;
}

const IMAGE_URL_PATTERN = /\.(png|jpe?g|webp|gif)(\?.*)?$/i;

export default function TicketDetailPage({ params }: TicketDetailPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const { data: ticket, isLoading, isError } = useSupportTicket(id);

  const replyMutation = useReplyToTicket(id);
  const escalateMutation = useEscalateTicket(id);
  const resolveMutation = useResolveTicket(id);
  const closeMutation = useCloseTicket(id);
  const reopenMutation = useReopenTicket(id);

  const [reply, setReply] = useState("");
  const [replyAttachment, setReplyAttachment] = useState<File | null>(null);
  const [replyAttachmentError, setReplyAttachmentError] = useState<
    string | null
  >(null);
  const [uploadingReply, setUploadingReply] = useState(false);
  const replyId = useId();
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!member) return null;

  if (isLoading) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">Loading ticket…</p>
      </div>
    );
  }

  if (!ticket || isError) {
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

  const isOwnTicket = ticket.raisedById === member.id;
  const isOwnCoopTicket =
    member.role === "admin" && ticket.cooperativeId === member.id;

  // Who's currently responsible for resolving/closing/escalating this ticket — only they get
  // those actions; the person who raised it can always reply, just never act on their own issue.
  const isAssignee =
    (member.role === "admin" &&
      ticket.assignedToRole === "admin" &&
      isOwnCoopTicket) ||
    (member.role === "super_admin" && ticket.assignedToRole === "super_admin");
  const isTerminal = ticket.status === "Resolved" || ticket.status === "Closed";
  const canReply = !isTerminal && (isAssignee || isOwnTicket);
  const canResolve = !isTerminal && isAssignee;
  const canClose = !isTerminal && isAssignee;
  const canEscalate =
    !isTerminal && isAssignee && ticket.assignedToRole === "admin";
  const canReopen = isTerminal && isAssignee;

  const anyActionBusy =
    replyMutation.isPending ||
    escalateMutation.isPending ||
    resolveMutation.isPending ||
    closeMutation.isPending ||
    reopenMutation.isPending;

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (file.size > MAX_ATTACHMENT_BYTES) {
      setReplyAttachmentError(
        `"${file.name}" is too large — attachments are limited to ${Math.round(MAX_ATTACHMENT_BYTES / 1024 / 1024)}MB.`,
      );
      return;
    }
    setReplyAttachmentError(null);
    setReplyAttachment(file);
  };

  const handleReply = async () => {
    if (!reply.trim()) return;
    try {
      let attachmentUrl: string | undefined;
      if (replyAttachment) {
        setUploadingReply(true);
        attachmentUrl = await uploadService.uploadAttachment(replyAttachment);
      }
      replyMutation.mutate(
        { message: reply.trim(), attachmentUrl },
        {
          onSuccess: () => {
            setReply("");
            setReplyAttachment(null);
            toast.success("Reply sent");
          },
          onError: (error) => {
            toast.error("Couldn't send reply", {
              description:
                error instanceof Error ? error.message : "Please try again.",
            });
          },
        },
      );
    } catch (error) {
      toast.error("Couldn't upload attachment", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setUploadingReply(false);
    }
  };

  const handleResolve = (resolutionNote: string) => {
    resolveMutation.mutate(resolutionNote, {
      onSuccess: () =>
        toast.success("Ticket resolved", {
          description: `${ticket.raisedByName} will be notified.`,
        }),
      onError: (error) =>
        toast.error("Couldn't resolve the ticket", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        }),
    });
  };

  const handleClose = (note: string) => {
    closeMutation.mutate(note || undefined, {
      onSuccess: () =>
        toast.success("Ticket closed", {
          description: `${ticket.raisedByName} will be notified.`,
        }),
      onError: (error) =>
        toast.error("Couldn't close the ticket", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        }),
    });
  };

  const handleEscalate = (note: string) => {
    escalateMutation.mutate(note || undefined, {
      onSuccess: () => toast.success("Escalated to the super admin"),
      onError: (error) =>
        toast.error("Couldn't escalate the ticket", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        }),
    });
  };

  const handleReopen = (note: string) => {
    reopenMutation.mutate(note || undefined, {
      onSuccess: () =>
        toast.success("Ticket reopened", {
          description: `${ticket.raisedByName} will be notified.`,
        }),
      onError: (error) =>
        toast.error("Couldn't reopen the ticket", {
          description:
            error instanceof Error ? error.message : "Please try again.",
        }),
    });
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
          <div className="flex flex-wrap items-center gap-2">
            <Badge
              variant={ticketStatusBadgeVariant(ticket.status)}
              className={cn(
                ticket.status === "Resolved" && "bg-success/15 text-success",
              )}
            >
              {ticket.status}
            </Badge>
            {canEscalate ? (
              <NoteDialog
                trigger="Escalate"
                triggerVariant="outline"
                title="Escalate to the super admin?"
                description="This forwards the ticket (with its full history) to the platform team — you'll no longer be able to act on it yourself."
                noteLabel="Note for the super admin (optional)"
                notePlaceholder="Why does this need platform-level attention?"
                noteRequired={false}
                confirmLabel="Escalate"
                busy={escalateMutation.isPending}
                onConfirm={handleEscalate}
              />
            ) : null}
            {canClose ? (
              <NoteDialog
                trigger="Close"
                triggerVariant="outline"
                title="Close this ticket?"
                description="Use this when the ticket doesn't need a fix — duplicate, no longer relevant, etc. The person who raised it will be notified."
                noteLabel="Reason (optional)"
                notePlaceholder="Why is this being closed?"
                noteRequired={false}
                confirmLabel="Close"
                busy={closeMutation.isPending}
                onConfirm={handleClose}
              />
            ) : null}
            {canResolve ? (
              <NoteDialog
                trigger="Resolve"
                title="Resolve this ticket?"
                description="The person who raised it will be notified it's resolved."
                noteLabel="Resolution note"
                notePlaceholder="What was done to resolve this?"
                noteRequired
                confirmLabel="Resolve"
                busy={resolveMutation.isPending}
                onConfirm={handleResolve}
              />
            ) : null}
            {canReopen ? (
              <NoteDialog
                trigger="Recheck / Reopen"
                triggerVariant="outline"
                title="Reopen this ticket?"
                description="This puts the ticket back in your queue for another look. The person who raised it will be notified."
                noteLabel="Note (optional)"
                notePlaceholder="Why is this being reopened?"
                noteRequired={false}
                confirmLabel="Reopen"
                busy={reopenMutation.isPending}
                onConfirm={handleReopen}
              />
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            {ticket.timeline.map((event) => (
              <TimelineEntry key={event.id} event={event} />
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
                disabled={anyActionBusy || uploadingReply}
              />

              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  {replyAttachment ? (
                    <div className="flex items-center gap-2 rounded-lg border border-border px-2.5 py-1.5 text-xs">
                      <Paperclip
                        className="size-3.5 shrink-0 text-muted-foreground"
                        aria-hidden="true"
                      />
                      <span className="max-w-40 truncate">
                        {replyAttachment.name}
                      </span>
                      <button
                        type="button"
                        onClick={() => setReplyAttachment(null)}
                        aria-label="Remove attachment"
                        className="text-muted-foreground transition-colors hover:text-foreground"
                        disabled={anyActionBusy || uploadingReply}
                      >
                        <X className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  ) : (
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={anyActionBusy || uploadingReply}
                    >
                      <Paperclip className="size-3.5" aria-hidden="true" />
                      Attach
                    </Button>
                  )}
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept=".pdf,.png,.jpg,.jpeg,.doc,.docx"
                    className="hidden"
                    onChange={handleFileChange}
                  />
                </div>

                <Button
                  type="button"
                  size="sm"
                  disabled={anyActionBusy || uploadingReply || !reply.trim()}
                  onClick={handleReply}
                >
                  {replyMutation.isPending || uploadingReply ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    "Send Reply"
                  )}
                </Button>
              </div>
              {replyAttachmentError ? (
                <p className="text-sm text-destructive">
                  {replyAttachmentError}
                </p>
              ) : null}
            </div>
          ) : null}
        </CardContent>
      </Card>
    </div>
  );
}

function TimelineEntry({ event }: { event: TicketEvent }) {
  const isImage = event.attachmentUrl
    ? IMAGE_URL_PATTERN.test(event.attachmentUrl)
    : false;
  return (
    <div className="flex items-start gap-3">
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary">
        {getInitials(event.actorName)}
      </span>
      <div className="min-w-0 flex-1 space-y-1">
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
          <p className="text-sm text-muted-foreground">{event.message}</p>
        ) : null}
        {event.attachmentUrl ? (
          isImage ? (
            <a
              href={event.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="block w-fit"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={event.attachmentUrl}
                alt="Attachment"
                className="max-h-48 rounded-lg border border-border object-cover"
              />
            </a>
          ) : (
            <a
              href={event.attachmentUrl}
              target="_blank"
              rel="noreferrer"
              className="flex w-fit items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs text-foreground hover:bg-muted/50"
            >
              <Paperclip className="size-3.5" aria-hidden="true" />
              View attachment
            </a>
          )
        ) : null}
      </div>
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
        : type === "Closed"
          ? "closed this"
          : type === "Reopened"
            ? "reopened this"
            : "replied";
  return <span className="text-xs text-muted-foreground">{label}</span>;
}

function NoteDialog({
  trigger,
  triggerVariant,
  title,
  description,
  noteLabel,
  notePlaceholder,
  noteRequired,
  confirmLabel,
  busy,
  onConfirm,
}: {
  trigger: string;
  triggerVariant?: "outline";
  title: string;
  description: string;
  noteLabel: string;
  notePlaceholder: string;
  noteRequired: boolean;
  confirmLabel: string;
  busy: boolean;
  onConfirm: (note: string) => void;
}) {
  const noteId = useId();
  const [open, setOpen] = useState(false);
  const [note, setNote] = useState("");

  const handleOpenChange = (next: boolean) => {
    if (!next) setNote("");
    setOpen(next);
  };

  const handleConfirm = () => {
    if (noteRequired && !note.trim()) return;
    onConfirm(note.trim());
    handleOpenChange(false);
  };

  return (
    <AlertDialog open={open} onOpenChange={handleOpenChange}>
      <AlertDialogTrigger
        render={<Button type="button" variant={triggerVariant} size="sm" />}
      >
        {trigger}
      </AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>{title}</AlertDialogTitle>
          <AlertDialogDescription>{description}</AlertDialogDescription>
        </AlertDialogHeader>
        <div className="space-y-2">
          <Label htmlFor={noteId}>{noteLabel}</Label>
          <Textarea
            id={noteId}
            rows={3}
            placeholder={notePlaceholder}
            value={note}
            onChange={(event) => setNote(event.target.value)}
            disabled={busy}
          />
        </div>
        <AlertDialogFooter>
          <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
          <AlertDialogAction
            disabled={busy || (noteRequired && !note.trim())}
            onClick={handleConfirm}
          >
            {busy ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              confirmLabel
            )}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}
