"use client";

import { useRouter } from "next/navigation";
import { Download } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { getNoticeStatus, type Notice } from "@/lib/notice-data";
import { formatDateLong } from "@/lib/format";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface NotificationDetailDialogProps {
  notice: Notice | null;
  onOpenChange: (open: boolean) => void;
}

/** The bell dropdown's quick-view — full detail (replies, resend/delete) still lives on
 * /notice-board/[id]; this is for reading one notification without leaving the current page. */
export function NotificationDetailDialog({
  notice,
  onOpenChange,
}: NotificationDetailDialogProps) {
  const router = useRouter();
  const cooperatives = useCoopStore((state) => state.cooperatives);

  if (!notice) return null;
  const status = getNoticeStatus(notice);

  return (
    <Dialog open={!!notice} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <div className="flex flex-wrap items-center gap-2">
            <DialogTitle>{notice.title}</DialogTitle>
            <Badge variant="outline">{notice.type}</Badge>
            <Badge
              variant={status === "Sent" ? "secondary" : "outline"}
              className={cn(status === "Sent" && "bg-success/15 text-success")}
            >
              {status}
            </Badge>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          <p className="text-xs text-muted-foreground">
            From {notice.createdByName} —{" "}
            {formatDateLong(new Date(notice.sendAt))}
          </p>

          <p className="max-h-48 overflow-y-auto text-sm whitespace-pre-line text-foreground">
            {notice.message}
          </p>

          <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-2">
            <Field label="Sent To" value={notice.recipient} />
            <Field label="Medium" value={notice.medium} />
            <Field
              label="Co-operative"
              value={
                !notice.targetCoopIds || notice.targetCoopIds.length === 0
                  ? "All co-operatives"
                  : notice.targetCoopIds
                      .map(
                        (id) =>
                          cooperatives.find((coop) => coop.id === id)?.name ??
                          id,
                      )
                      .join(", ")
              }
            />
            {notice.meetingDate ? (
              <Field
                label="Meeting Date"
                value={formatDateLong(new Date(notice.meetingDate))}
              />
            ) : null}
          </div>

          {notice.attachment ? (
            <a
              href={notice.attachment.dataUrl}
              download={notice.attachment.name}
              className="inline-flex items-center gap-2 rounded-lg border border-border px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted"
            >
              <Download className="size-4" aria-hidden="true" />
              {notice.attachment.name}
              <span className="text-xs text-muted-foreground">
                ({Math.round(notice.attachment.size / 1024)} KB)
              </span>
            </a>
          ) : null}
        </div>

        <DialogFooter>
          <Button variant="ghost" onClick={() => onOpenChange(false)}>
            Close
          </Button>
          <Button onClick={() => router.push(`/notice-board/${notice.id}`)}>
            View Full Notice & Replies
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="space-y-0.5">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="font-medium text-foreground">{value}</p>
    </div>
  );
}
