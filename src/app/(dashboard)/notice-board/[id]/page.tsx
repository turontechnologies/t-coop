"use client";

import { use, useEffect } from "react";
import { useRouter } from "next/navigation";
import { ArrowLeft, Download, Loader2, RefreshCcw, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
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
import { ReplyThread } from "@/components/features/notice-board/reply-thread";
import { getNoticeStatus } from "@/lib/notice-data";
import { formatDateLong } from "@/lib/format";
import { NOTICE_STORE_NAME, useNoticeStore } from "@/store/notice.store";
import { useCrossTabSync } from "@/hooks/use-cross-tab-sync";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface NoticeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function NoticeDetailsPage({ params }: NoticeDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const notices = useNoticeStore((state) => state.notices);
  const resendNotice = useNoticeStore((state) => state.resendNotice);
  const deleteNotice = useNoticeStore((state) => state.deleteNotice);
  const markRead = useNoticeStore((state) => state.markRead);
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  useCrossTabSync(NOTICE_STORE_NAME, () => useNoticeStore.persist.rehydrate());

  const notice = notices.find((item) => item.id === id);

  useEffect(() => {
    if (member && notice) markRead(member.id, notice.id);
  }, [member, notice, markRead]);

  if (!member || !notice) {
    return (
      <div className="space-y-4 pt-6">
        <p className="text-sm text-muted-foreground">
          We couldn&apos;t find that notice.
        </p>
        <Button variant="outline" onClick={() => router.push("/notice-board")}>
          <ArrowLeft className="size-4" aria-hidden="true" />
          Back to Notice Board
        </Button>
      </div>
    );
  }

  const status = getNoticeStatus(notice);
  const canManage = member.role !== "member";

  const handleResend = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    resendNotice(notice.id);
    setBusy(false);
    toast.success("Notice resent");
  };

  const handleDelete = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    deleteNotice(notice.id);
    setBusy(false);
    setDeleteOpen(false);
    toast.success("Notice deleted");
    router.push("/notice-board");
  };

  return (
    <div className="space-y-4 pt-6">
      <Button
        variant="ghost"
        size="sm"
        onClick={() => router.push("/notice-board")}
        className="text-muted-foreground"
      >
        <ArrowLeft className="size-4" aria-hidden="true" />
        Back
      </Button>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-1.5">
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{notice.title}</CardTitle>
                <Badge variant="outline">{notice.type}</Badge>
                <Badge
                  variant={status === "Sent" ? "secondary" : "outline"}
                  className={cn(
                    status === "Sent" && "bg-success/15 text-success",
                  )}
                >
                  {status}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground">
                From {notice.createdByName} —{" "}
                {formatDateLong(new Date(notice.sendAt))}
              </p>
            </div>

            {canManage ? (
              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={handleResend}
                  disabled={busy}
                >
                  {busy ? (
                    <Loader2
                      className="size-3.5 animate-spin"
                      aria-hidden="true"
                    />
                  ) : (
                    <RefreshCcw className="size-3.5" aria-hidden="true" />
                  )}
                  Resend
                </Button>
                <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                  <AlertDialogTrigger
                    render={
                      <Button
                        variant="outline"
                        size="icon"
                        className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                        aria-label="Delete notice"
                      />
                    }
                  >
                    <Trash2 className="size-4" aria-hidden="true" />
                  </AlertDialogTrigger>
                  <AlertDialogContent>
                    <AlertDialogHeader>
                      <AlertDialogTitle>Delete Notice</AlertDialogTitle>
                      <AlertDialogDescription>
                        Are you sure you want to delete &quot;{notice.title}
                        &quot;? This can&apos;t be undone.
                      </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                      <AlertDialogCancel disabled={busy}>
                        Cancel
                      </AlertDialogCancel>
                      <AlertDialogAction
                        variant="destructive"
                        disabled={busy}
                        onClick={handleDelete}
                      >
                        {busy ? (
                          <Loader2
                            className="size-4 animate-spin"
                            aria-hidden="true"
                          />
                        ) : (
                          "Delete"
                        )}
                      </AlertDialogAction>
                    </AlertDialogFooter>
                  </AlertDialogContent>
                </AlertDialog>
              </div>
            ) : null}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="whitespace-pre-line text-sm text-foreground">
            {notice.message}
          </p>

          <div className="grid grid-cols-1 gap-x-8 gap-y-3 border-t border-border pt-4 text-sm sm:grid-cols-3">
            <Field label="Sent To" value={notice.recipient} />
            <Field label="Medium" value={notice.medium} />
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
        </CardContent>
      </Card>

      <Card>
        <CardContent>
          <ReplyThread noticeId={notice.id} member={member} />
        </CardContent>
      </Card>
    </div>
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
