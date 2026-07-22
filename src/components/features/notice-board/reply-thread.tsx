"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import { Loader2, Send } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { getInitials } from "@/lib/format";
import type { NoticeReply } from "@/lib/notice-data";
import { useNoticeStore } from "@/store/notice.store";
import type { AuthenticatedMember } from "@/types/auth";

function Avatar({
  name,
  avatarUrl,
  emphasized = false,
}: {
  name: string;
  avatarUrl?: string;
  emphasized?: boolean;
}) {
  if (avatarUrl) {
    return (
      <Image
        src={avatarUrl}
        alt={name}
        width={36}
        height={36}
        className="size-9 shrink-0 rounded-full object-cover"
      />
    );
  }
  return (
    <span
      className={
        emphasized
          ? "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary text-xs font-semibold text-primary-foreground"
          : "flex size-9 shrink-0 items-center justify-center rounded-full bg-primary/10 text-xs font-semibold text-primary"
      }
    >
      {getInitials(name)}
    </span>
  );
}

interface ReplyThreadProps {
  noticeId: string;
  member: AuthenticatedMember;
}

function formatTimestamp(iso: string): string {
  return new Date(iso).toLocaleString("en-NG", {
    day: "numeric",
    month: "short",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export function ReplyThread({ noticeId, member }: ReplyThreadProps) {
  const replies = useNoticeStore((state) => state.replies);
  const addReply = useNoticeStore((state) => state.addReply);
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const threadReplies = useMemo(
    () =>
      replies
        .filter((reply) => reply.noticeId === noticeId)
        .sort((a, b) => a.createdAt.localeCompare(b.createdAt)),
    [replies, noticeId],
  );

  const handleSend = async () => {
    const trimmed = message.trim();
    if (!trimmed) return;

    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 400));

    const reply: NoticeReply = {
      id: `reply-${Date.now()}`,
      noticeId,
      authorId: member.id,
      authorName: member.name,
      authorRole: member.role,
      authorAvatarUrl: member.avatarUrl,
      message: trimmed,
      createdAt: new Date().toISOString(),
    };
    addReply(reply);
    setMessage("");
    setBusy(false);
    toast.success("Reply sent");
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-foreground">
          Feedback {threadReplies.length > 0 ? `(${threadReplies.length})` : ""}
        </h3>
      </div>

      <div className="space-y-4">
        {threadReplies.length === 0 ? (
          <p className="rounded-xl border border-dashed border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No replies yet. Be the first to respond.
          </p>
        ) : (
          threadReplies.map((reply) => (
            <div key={reply.id} className="flex gap-3">
              <Avatar
                name={reply.authorName}
                avatarUrl={reply.authorAvatarUrl}
              />
              <div className="min-w-0 flex-1 space-y-1 rounded-xl bg-accent/50 px-3.5 py-2.5">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      {reply.authorName}
                    </span>
                    {reply.authorRole !== "member" ? (
                      <Badge variant="secondary" className="text-[10px]">
                        {reply.authorRole === "super_admin"
                          ? "Super Admin"
                          : "Admin"}
                      </Badge>
                    ) : null}
                  </div>
                  <span className="text-xs text-muted-foreground">
                    {formatTimestamp(reply.createdAt)}
                  </span>
                </div>
                <p className="text-sm text-foreground">{reply.message}</p>
              </div>
            </div>
          ))
        )}
      </div>

      <div className="flex items-start gap-3 border-t border-border pt-4">
        <Avatar name={member.name} avatarUrl={member.avatarUrl} emphasized />
        <div className="min-w-0 flex-1 space-y-2">
          <Textarea
            value={message}
            onChange={(event) => setMessage(event.target.value)}
            placeholder="Write a reply…"
            rows={2}
            disabled={busy}
            onKeyDown={(event) => {
              if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                handleSend();
              }
            }}
          />
          <div className="flex justify-end">
            <Button
              type="button"
              size="sm"
              onClick={handleSend}
              disabled={busy || !message.trim()}
            >
              {busy ? (
                <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
              ) : (
                <Send className="size-3.5" aria-hidden="true" />
              )}
              Send
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
