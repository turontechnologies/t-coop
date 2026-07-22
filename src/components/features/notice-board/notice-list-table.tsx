"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Filter, Loader2, RefreshCcw, Trash2 } from "lucide-react";
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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  getNoticeStatus,
  noticeExcerpt,
  type Notice,
  type NoticeType,
} from "@/lib/notice-data";
import { formatDateLong } from "@/lib/format";
import { useNoticeStore } from "@/store/notice.store";
import { cn } from "@/lib/utils";

const MONTHS = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December",
];
const NOTICE_TYPES: (NoticeType | "All types")[] = [
  "All types",
  "General",
  "Meeting Notice",
  "Meeting Minutes",
];
const STATUSES = ["All statuses", "Scheduled", "Sent"] as const;
const PAGE_SIZE = 5;

interface NoticeListTableProps {
  notices: Notice[];
}

export function NoticeListTable({ notices }: NoticeListTableProps) {
  const router = useRouter();
  const resendNotice = useNoticeStore((state) => state.resendNotice);
  const deleteNotice = useNoticeStore((state) => state.deleteNotice);

  const [month, setMonth] = useState<string>("All months");
  const [year, setYear] = useState<string>("All years");
  const [typeFilter, setTypeFilter] =
    useState<(typeof NOTICE_TYPES)[number]>("All types");
  const [statusFilter, setStatusFilter] =
    useState<(typeof STATUSES)[number]>("All statuses");
  const [page, setPage] = useState(1);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [busy, setBusy] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const years = useMemo(() => {
    const set = new Set(
      notices.map((notice) => new Date(notice.sendAt).getFullYear()),
    );
    set.add(new Date().getFullYear());
    return Array.from(set).sort((a, b) => b - a);
  }, [notices]);

  const filtered = useMemo(() => {
    return notices.filter((notice) => {
      const sentDate = new Date(notice.sendAt);
      const matchesMonth =
        month === "All months" || MONTHS[sentDate.getMonth()] === month;
      const matchesYear =
        year === "All years" || String(sentDate.getFullYear()) === year;
      const matchesType =
        typeFilter === "All types" || notice.type === typeFilter;
      const matchesStatus =
        statusFilter === "All statuses" ||
        getNoticeStatus(notice) === statusFilter;
      return matchesMonth && matchesYear && matchesType && matchesStatus;
    });
  }, [notices, month, year, typeFilter, statusFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const currentPage = Math.min(page, totalPages);
  const pageNotices = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE,
  );

  const toggleSelected = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const allPageSelected =
    pageNotices.length > 0 &&
    pageNotices.every((notice) => selected.has(notice.id));

  const toggleSelectAll = () => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (allPageSelected) {
        pageNotices.forEach((notice) => next.delete(notice.id));
      } else {
        pageNotices.forEach((notice) => next.add(notice.id));
      }
      return next;
    });
  };

  const handleResend = async () => {
    if (selected.size === 0) {
      toast.error("Select at least one notice to resend");
      return;
    }
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 700));
    selected.forEach((id) => resendNotice(id));
    setBusy(false);
    toast.success(
      selected.size === 1 ? "Notice resent" : `${selected.size} notices resent`,
    );
    setSelected(new Set());
  };

  const handleDelete = async () => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    selected.forEach((id) => deleteNotice(id));
    setBusy(false);
    setDeleteOpen(false);
    toast.success(
      selected.size === 1
        ? "Notice deleted"
        : `${selected.size} notices deleted`,
    );
    setSelected(new Set());
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="flex flex-wrap items-end gap-3">
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Month</p>
            <Select
              value={month}
              onValueChange={(value) => {
                setMonth(value ?? "All months");
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-36">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All months">All months</SelectItem>
                {MONTHS.map((m) => (
                  <SelectItem key={m} value={m}>
                    {m}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-1.5">
            <p className="text-xs text-muted-foreground">Year</p>
            <Select
              value={year}
              onValueChange={(value) => {
                setYear(value ?? "All years");
                setPage(1);
              }}
            >
              <SelectTrigger size="sm" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="All years">All years</SelectItem>
                {years.map((y) => (
                  <SelectItem key={y} value={String(y)}>
                    {y}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Popover>
            <PopoverTrigger
              render={
                <Button variant="outline" size="sm" className="gap-1.5" />
              }
            >
              <Filter className="size-3.5" aria-hidden="true" />
              Filters
            </PopoverTrigger>
            <PopoverContent className="w-64 space-y-3">
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Notice Type</p>
                <Select
                  value={typeFilter}
                  onValueChange={(value) => {
                    setTypeFilter(value as typeof typeFilter);
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {NOTICE_TYPES.map((t) => (
                      <SelectItem key={t} value={t}>
                        {t}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <p className="text-xs text-muted-foreground">Status</p>
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value as typeof statusFilter);
                    setPage(1);
                  }}
                >
                  <SelectTrigger size="sm" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </PopoverContent>
          </Popover>
        </div>

        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleResend}
            disabled={busy || selected.size === 0}
          >
            {busy ? (
              <Loader2 className="size-3.5 animate-spin" aria-hidden="true" />
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
                  disabled={selected.size === 0}
                  className="text-destructive hover:bg-destructive/10 hover:text-destructive"
                  aria-label="Delete selected notices"
                />
              }
            >
              <Trash2 className="size-4" aria-hidden="true" />
            </AlertDialogTrigger>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Delete Notices</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {selected.size} selected
                  notice{selected.size === 1 ? "" : "s"}? This can&apos;t be
                  undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel disabled={busy}>Cancel</AlertDialogCancel>
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
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[640px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="w-10 px-4 py-2.5">
                <Checkbox
                  checked={allPageSelected}
                  onCheckedChange={toggleSelectAll}
                  aria-label="Select all notices on this page"
                />
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Published Date
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Medium Type
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Announcement
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
            </tr>
          </thead>
          <tbody>
            {pageNotices.length === 0 ? (
              <tr>
                <td
                  colSpan={5}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No notices match your filters.
                </td>
              </tr>
            ) : (
              pageNotices.map((notice) => {
                const status = getNoticeStatus(notice);
                return (
                  <tr
                    key={notice.id}
                    onClick={() => router.push(`/notice-board/${notice.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td
                      className="px-4 py-3"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <Checkbox
                        checked={selected.has(notice.id)}
                        onCheckedChange={() => toggleSelected(notice.id)}
                        aria-label={`Select ${notice.title}`}
                      />
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {formatDateLong(new Date(notice.sendAt))}
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">
                      {notice.medium}
                    </td>
                    <td className="px-4 py-3 text-foreground">
                      <span className="font-medium">{notice.title}</span>
                      <span className="text-muted-foreground">
                        {" "}
                        — {noticeExcerpt(notice.message)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <Badge
                        variant={status === "Sent" ? "secondary" : "outline"}
                        className={cn(
                          status === "Sent" && "bg-success/15 text-success",
                        )}
                      >
                        {status}
                      </Badge>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <span>
          {filtered.length === 0
            ? "0 notices"
            : `${(currentPage - 1) * PAGE_SIZE + 1}-${Math.min(currentPage * PAGE_SIZE, filtered.length)} of ${filtered.length}`}
        </span>
        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
          >
            Previous
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              type="button"
              variant={num === currentPage ? "default" : "ghost"}
              size="icon"
              onClick={() => setPage(num)}
              className="text-sm font-medium"
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </Button>
        </div>
      </div>
    </div>
  );
}
