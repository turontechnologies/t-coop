"use client";

import { useRef, useState } from "react";
import { Loader2, Paperclip, Send, X } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { useNoticeMutations, useNotices } from "@/hooks/use-notices";
import type { Notice, NoticeAttachment } from "@/types/notice";

const MAX_ATTACHMENT_BYTES = 2 * 1024 * 1024;

export function MeetingMinutesCard({
  meeting,
  canWrite,
}: {
  meeting: Notice;
  canWrite: boolean;
}) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [message, setMessage] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [isSending, setIsSending] = useState(false);
  const mutations = useNoticeMutations();
  const { data: notices = [] } = useNotices();
  const minutes = notices.filter(
    (notice) =>
      notice.type === "Meeting Minutes" &&
      notice.meetingNoticeId === meeting.id,
  );

  const sendMinutes = async () => {
    if (!message.trim() && !file) {
      toast.error("Add the meeting minutes or attach a file");
      return;
    }

    setIsSending(true);
    try {
      let attachment: NoticeAttachment | undefined;
      if (file) attachment = await mutations.uploadAttachment.mutateAsync(file);
      const notice = await mutations.create.mutateAsync({
        type: "Meeting Minutes",
        title: `Minutes: ${meeting.title}`,
        message: message.trim(),
        recipient: meeting.recipient,
        medium: meeting.medium,
        meetingNoticeId: meeting.id,
        attachment,
        sendAt: new Date().toISOString(),
        targetCoopIds: meeting.targetCoopIds,
      });
      setMessage("");
      setFile(null);
      toast.success("Meeting minutes sent", {
        description: `Sent to ${notice.recipient.toLowerCase()} invited to this meeting.`,
      });
    } catch (error) {
      toast.error("Couldn't send the meeting minutes", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    } finally {
      setIsSending(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Meeting Minutes</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {minutes.map((item) => (
          <div
            key={item.id}
            className="space-y-2 rounded-lg border border-border p-3"
          >
            <p className="text-sm font-medium text-foreground">{item.title}</p>
            {item.message ? (
              <p className="whitespace-pre-line text-sm text-muted-foreground">
                {item.message}
              </p>
            ) : null}
            {item.attachment ? (
              <a
                href={item.attachment.url}
                target="_blank"
                rel="noreferrer"
                className="inline-flex items-center gap-2 text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                <Paperclip className="size-3.5" aria-hidden="true" />
                {item.attachment.name}
              </a>
            ) : null}
          </div>
        ))}

        {minutes.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No minutes have been sent for this meeting yet.
          </p>
        ) : null}

        {canWrite ? (
          <div className="space-y-3 border-t border-border pt-4">
            <Textarea
              value={message}
              onChange={(event) => setMessage(event.target.value)}
              maxLength={10000}
              rows={5}
              placeholder="Write the meeting minutes, or attach a minutes file."
              disabled={isSending}
              aria-label="Meeting minutes"
            />
            {file ? (
              <div className="flex items-center justify-between gap-3 rounded-lg border border-border px-3 py-2 text-sm">
                <span className="flex min-w-0 items-center gap-2">
                  <Paperclip
                    className="size-3.5 shrink-0 text-muted-foreground"
                    aria-hidden="true"
                  />
                  <span className="truncate">{file.name}</span>
                  <span className="shrink-0 text-xs text-muted-foreground">
                    ({Math.round(file.size / 1024)} KB)
                  </span>
                </span>
                <button
                  type="button"
                  onClick={() => setFile(null)}
                  disabled={isSending}
                  aria-label="Remove minutes file"
                  className="text-muted-foreground hover:text-foreground"
                >
                  <X className="size-4" aria-hidden="true" />
                </button>
              </div>
            ) : null}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf,.doc,.docx,.png,.jpg,.jpeg"
              className="hidden"
              onChange={(event) => {
                const next = event.target.files?.[0] ?? null;
                event.target.value = "";
                if (!next) return;
                if (next.size > MAX_ATTACHMENT_BYTES) {
                  toast.error("File is too large", {
                    description: "Meeting minutes files are limited to 2 MB.",
                  });
                  return;
                }
                setFile(next);
              }}
            />
            <div className="flex flex-wrap justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => fileInputRef.current?.click()}
                disabled={isSending || !!file}
              >
                <Paperclip className="size-4" aria-hidden="true" />
                Attach a file
              </Button>
              <Button
                type="button"
                onClick={sendMinutes}
                disabled={isSending || (!message.trim() && !file)}
              >
                {isSending ? (
                  <Loader2 className="size-4 animate-spin" aria-hidden="true" />
                ) : (
                  <Send className="size-4" aria-hidden="true" />
                )}
                Send to meeting attendees
              </Button>
            </div>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
