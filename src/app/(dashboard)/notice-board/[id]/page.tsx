"use client";

import { use } from "react";
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
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { ReplyThread } from "@/components/features/notice-board/reply-thread";
import { formatDateLong } from "@/lib/format";
import { useCooperatives } from "@/hooks/use-cooperatives";
import { useNotice, useNoticeMutations } from "@/hooks/use-notices";
import { useAuthStore } from "@/store/auth.store";
import { cn } from "@/lib/utils";

interface NoticeDetailsPageProps {
  params: Promise<{ id: string }>;
}

export default function NoticeDetailsPage({ params }: NoticeDetailsPageProps) {
  const { id } = use(params);
  const router = useRouter();
  const member = useAuthStore((state) => state.member);
  const {
    data: notice,
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useNotice(id);
  const { data: cooperatives = [] } = useCooperatives();
  const { resend, remove } = useNoticeMutations();
  const [deleteOpen, setDeleteOpen] = useState(false);

  if (!member) return null;

  const canManage = member.role !== "member";

  const handleResend = async () => {
    try {
      await resend.mutateAsync(id);
      toast.success("Notice resent");
    } catch (err) {
      toast.error("Couldn't resend that notice", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
  };

  const handleDelete = async () => {
    try {
      await remove.mutateAsync(id);
      setDeleteOpen(false);
      toast.success("Notice deleted");
      router.push("/notice-board");
    } catch (err) {
      toast.error("Couldn't delete that notice", {
        description: err instanceof Error ? err.message : "Please try again.",
      });
    }
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

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't find that notice"
      >
        {!notice ? null : (
          <>
            <Card>
              <CardHeader>
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div className="space-y-1.5">
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{notice.title}</CardTitle>
                      <Badge variant="outline">{notice.type}</Badge>
                      <Badge
                        variant={notice.status === "Sent" ? "secondary" : "outline"}
                        className={cn(
                          notice.status === "Sent" && "bg-success/15 text-success",
                        )}
                      >
                        {notice.status}
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
                        disabled={resend.isPending}
                      >
                        {resend.isPending ? (
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
                            <AlertDialogCancel disabled={remove.isPending}>
                              Cancel
                            </AlertDialogCancel>
                            <AlertDialogAction
                              variant="destructive"
                              disabled={remove.isPending}
                              onClick={handleDelete}
                            >
                              {remove.isPending ? (
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
                  <Field
                    label="Co-operative"
                    value={notice.targetCoopIds
                      .map((cid) => cooperatives.find((coop) => coop.id === cid)?.name ?? cid)
                      .join(", ")}
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
                    href={notice.attachment.url}
                    target="_blank"
                    rel="noreferrer"
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
          </>
        )}
      </QueryBoundary>
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
