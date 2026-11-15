"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Download,
  FilterX,
  Loader2,
  MoreHorizontal,
  Search,
  ShieldAlert,
  TriangleAlert,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { ActivityDetailsPanel } from "@/components/features/settings/activity-details-panel";
import {
  AnimatedNumber,
  EASE,
  Segmented,
} from "@/components/features/settings/payment-ui";
import { useAuditLog, useExportAuditLog } from "@/hooks/use-audit-log";
import {
  getActionIcon,
  getModuleIcon,
  getStatusStyle,
} from "@/lib/audit-log-ui";
import type { AuditLogEntry, AuditLogFilters } from "@/lib/audit-log-data";
import { formatDateTime, formatTimeAgo, getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const PAGE_SIZES = [25, 50, 100];
const ALL = "all";

const ROLES: { value: string; label: string }[] = [
  { value: ALL, label: "Everyone" },
  { value: "super_admin", label: "Super admins" },
  { value: "support", label: "Platform staff" },
  { value: "admin", label: "Co-op admins" },
  { value: "member", label: "Members" },
];

type StatusFilter = "all" | "Success" | "Failed";

const count = (n: number) => String(Math.round(n));

/** Super admin: the complete audit log, a page at a time, with filters and CSV export. */
export function SettingsLogsTab() {
  const [searchInput, setSearchInput] = useState("");
  const [search, setSearch] = useState("");
  const [module, setModule] = useState(ALL);
  const [role, setRole] = useState(ALL);
  const [status, setStatus] = useState<StatusFilter>("all");
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");
  const [pageState, setPageState] = useState({ key: "", page: 0 });
  const [size, setSize] = useState(PAGE_SIZES[0]);
  const [selectedEntry, setSelectedEntry] = useState<AuditLogEntry | null>(
    null,
  );

  // Wait for a pause in typing before searching the server.
  useEffect(() => {
    const timer = setTimeout(() => setSearch(searchInput.trim()), 350);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const filters = useMemo<AuditLogFilters>(
    () => ({
      q: search || undefined,
      module: module === ALL ? undefined : module,
      role: role === ALL ? undefined : role,
      status: status === "all" ? undefined : status,
      from: from || undefined,
      to: to || undefined,
    }),
    [search, module, role, status, from, to],
  );

  // Any filter or page-size change starts again from the first page.
  const pageKey = `${JSON.stringify(filters)}|${size}`;
  const page = pageState.key === pageKey ? pageState.page : 0;
  const setPage = (next: number) => setPageState({ key: pageKey, page: next });

  const query = useAuditLog(filters, page, size);
  const exportLog = useExportAuditLog();
  const data = query.data;
  const entries = data?.content ?? [];
  const filtered =
    !!filters.q ||
    !!filters.module ||
    !!filters.role ||
    !!filters.status ||
    !!from ||
    !!to;

  function clearFilters() {
    setSearchInput("");
    setSearch("");
    setModule(ALL);
    setRole(ALL);
    setStatus("all");
    setFrom("");
    setTo("");
  }

  async function handleExport() {
    try {
      await exportLog.mutateAsync(filters);
      toast.success("Activity log downloaded", {
        description: filtered
          ? "Every entry matching your filters is in the file."
          : "Every entry in the log is in the file.",
      });
    } catch (error) {
      toast.error("Couldn't export the log", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  }

  const stats = [
    {
      label: "Entries in the log",
      value: data?.stats.total,
      icon: Activity,
      tone: "bg-sky-500/12 text-sky-700 dark:text-sky-300",
    },
    {
      label: "Today",
      value: data?.stats.today,
      icon: CalendarDays,
      tone: "bg-emerald-500/12 text-emerald-700 dark:text-emerald-300",
    },
    {
      label: "Failed today",
      value: data?.stats.failedToday,
      icon: ShieldAlert,
      tone: data?.stats.failedToday
        ? "bg-rose-500/12 text-rose-700 dark:text-rose-300"
        : "bg-muted text-muted-foreground",
      onClick: () => {
        setStatus("Failed");
        const today = new Date();
        const iso = `${today.getFullYear()}-${String(today.getMonth() + 1).padStart(2, "0")}-${String(today.getDate()).padStart(2, "0")}`;
        setFrom(iso);
        setTo(iso);
      },
    },
  ];

  const first = data && data.totalElements > 0 ? data.page * data.size + 1 : 0;
  const last = data
    ? Math.min((data.page + 1) * data.size, data.totalElements)
    : 0;

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
        {stats.map((stat, index) => (
          <motion.button
            key={stat.label}
            type="button"
            disabled={!stat.onClick}
            onClick={stat.onClick}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.35, delay: index * 0.05, ease: EASE }}
            className={cn(
              "flex items-center gap-3 rounded-2xl border border-border bg-card p-4 text-left shadow-card transition-all",
              stat.onClick && "hover:-translate-y-0.5 hover:shadow-raised",
            )}
          >
            <span
              className={cn(
                "flex size-10 items-center justify-center rounded-xl",
                stat.tone,
              )}
            >
              <stat.icon className="size-5" aria-hidden="true" />
            </span>
            <div>
              <p className="text-xl font-bold text-foreground">
                {stat.value == null ? (
                  "—"
                ) : (
                  <AnimatedNumber value={stat.value} format={count} />
                )}
              </p>
              <p className="text-xs text-muted-foreground">{stat.label}</p>
            </div>
          </motion.button>
        ))}
      </div>

      <div className="space-y-3 rounded-2xl border border-border bg-muted/30 p-3 sm:p-4">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center">
          <div className="relative flex-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-muted-foreground"
              aria-hidden="true"
            />
            <Input
              value={searchInput}
              onChange={(event) => setSearchInput(event.target.value)}
              placeholder="Search by person, ID, what was changed or IP address"
              aria-label="Search the activity log"
              className="h-10 bg-card pl-9"
            />
          </div>
          <Segmented
            label="Status"
            value={status}
            onChange={setStatus}
            options={[
              { value: "all", label: "All" },
              { value: "Success", label: "Succeeded" },
              { value: "Failed", label: "Failed" },
            ]}
          />
          <Button
            type="button"
            onClick={handleExport}
            disabled={exportLog.isPending || !data || data.totalElements === 0}
          >
            {exportLog.isPending ? (
              <Loader2 className="size-4 animate-spin" aria-hidden="true" />
            ) : (
              <Download className="size-4" aria-hidden="true" />
            )}
            {exportLog.isPending
              ? "Preparing…"
              : `Export${data ? ` ${data.totalElements.toLocaleString()}` : ""} to CSV`}
          </Button>
        </div>
        <div className="flex flex-wrap items-end gap-3">
          <FilterSelect
            label="Module"
            value={module}
            onChange={setModule}
            options={[
              { value: ALL, label: "All modules" },
              ...(data?.modules ?? []).map((m) => ({ value: m, label: m })),
            ]}
          />
          <FilterSelect
            label="Who"
            value={role}
            onChange={setRole}
            options={ROLES}
          />
          <DateFilter
            label="From"
            value={from}
            max={to || undefined}
            onChange={setFrom}
          />
          <DateFilter
            label="To"
            value={to}
            min={from || undefined}
            onChange={setTo}
          />
          {filtered ? (
            <Button type="button" variant="ghost" onClick={clearFilters}>
              <FilterX className="size-4" aria-hidden="true" />
              Clear filters
            </Button>
          ) : null}
          {query.isFetching && !query.isLoading ? (
            <Loader2
              className="mb-2.5 size-4 animate-spin text-muted-foreground"
              aria-label="Updating"
            />
          ) : null}
        </div>
      </div>

      {query.isLoading ? (
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <div
              key={index}
              className="h-12 animate-pulse rounded-xl bg-muted"
            />
          ))}
        </div>
      ) : query.isError ? (
        <div className="flex flex-col items-center gap-3 rounded-2xl border border-border py-10 text-center">
          <TriangleAlert
            className="size-6 text-destructive"
            aria-hidden="true"
          />
          <div className="space-y-1">
            <p className="text-sm font-medium text-foreground">
              Couldn&apos;t load the activity log
            </p>
            <p className="text-sm text-muted-foreground">
              {query.error instanceof Error
                ? query.error.message
                : "Please check your connection and try again."}
            </p>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => query.refetch()}
            disabled={query.isFetching}
          >
            {query.isFetching ? "Retrying…" : "Try again"}
          </Button>
        </div>
      ) : (
        <>
          <div
            className={cn(
              "hidden overflow-x-auto rounded-2xl border border-border transition-opacity sm:block",
              query.isPlaceholderData && "opacity-60",
            )}
          >
            <table className="w-full min-w-[1000px] text-left text-sm">
              <thead>
                <tr className="border-b border-border bg-muted/50">
                  {[
                    "When",
                    "Who",
                    "Co-operative",
                    "Module",
                    "Action",
                    "What",
                    "Status",
                    "IP address",
                    "",
                  ].map((heading, index) => (
                    <th
                      key={heading || index}
                      className="px-4 py-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
                    >
                      {heading || <span className="sr-only">More</span>}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {entries.length === 0 ? (
                  <tr>
                    <td
                      colSpan={9}
                      className="px-4 py-10 text-center text-muted-foreground"
                    >
                      {filtered
                        ? "No activity matches your filters."
                        : "No activity yet."}
                    </td>
                  </tr>
                ) : (
                  entries.map((entry) => {
                    const ModuleIcon = getModuleIcon(entry.module);
                    const ActionIcon = getActionIcon(entry.action);
                    const statusStyle = getStatusStyle(entry.status);
                    const StatusIcon = statusStyle.icon;
                    return (
                      <tr
                        key={entry.id}
                        onClick={() => setSelectedEntry(entry)}
                        className={cn(
                          "cursor-pointer border-b border-border last:border-0 hover:bg-muted/50",
                          entry.status === "Failed" && "bg-destructive/[0.03]",
                        )}
                      >
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className="block text-foreground">
                            {formatTimeAgo(entry.date)}
                          </span>
                          <span className="block text-[11px] text-muted-foreground">
                            {formatDateTime(entry.date)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center gap-2">
                            <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-primary text-[10px] font-semibold text-primary-foreground">
                              {getInitials(entry.activityBy)}
                            </span>
                            <span className="min-w-0">
                              <span className="block truncate font-medium text-foreground">
                                {entry.activityBy}
                              </span>
                              <span className="block truncate text-[11px] text-muted-foreground">
                                {entry.role}
                              </span>
                            </span>
                          </div>
                        </td>
                        <td className="max-w-[160px] truncate px-4 py-3 text-muted-foreground">
                          {entry.cooperative ?? "Platform"}
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <ModuleIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            {entry.module}
                          </span>
                        </td>
                        <td className="px-4 py-3 text-muted-foreground">
                          <span className="flex items-center gap-1.5">
                            <ActionIcon
                              className="size-3.5"
                              aria-hidden="true"
                            />
                            {entry.action}
                          </span>
                        </td>
                        <td
                          className="max-w-[220px] truncate px-4 py-3 text-foreground"
                          title={entry.resource}
                        >
                          {entry.resource}
                        </td>
                        <td className="px-4 py-3">
                          <span
                            className={cn(
                              "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                              statusStyle.badgeClassName,
                            )}
                          >
                            <StatusIcon className="size-3" aria-hidden="true" />
                            {entry.status}
                          </span>
                        </td>
                        <td className="px-4 py-3 font-mono text-xs text-muted-foreground">
                          {entry.ipAddress}
                        </td>
                        <td className="px-4 py-3">
                          <button
                            type="button"
                            onClick={(event) => {
                              event.stopPropagation();
                              setSelectedEntry(entry);
                            }}
                            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                            aria-label="View activity details"
                          >
                            <MoreHorizontal
                              className="size-3.5"
                              aria-hidden="true"
                            />
                          </button>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>

          <MobileRecordList
            isEmpty={entries.length === 0}
            emptyMessage={
              filtered
                ? "No activity matches your filters."
                : "No activity yet."
            }
          >
            {entries.map((entry) => {
              const statusStyle = getStatusStyle(entry.status);
              const StatusIcon = statusStyle.icon;
              return (
                <MobileRecordCard
                  key={entry.id}
                  onClick={() => setSelectedEntry(entry)}
                  title={entry.activityBy}
                  badge={
                    <span
                      className={cn(
                        "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium",
                        statusStyle.badgeClassName,
                      )}
                    >
                      <StatusIcon className="size-3" aria-hidden="true" />
                      {entry.status}
                    </span>
                  }
                  fields={[
                    { label: "When", value: formatDateTime(entry.date) },
                    {
                      label: "Co-operative",
                      value: entry.cooperative ?? "Platform",
                    },
                    { label: "Module", value: entry.module },
                    { label: "Action", value: entry.action },
                    { label: "What", value: entry.resource },
                    { label: "IP address", value: entry.ipAddress },
                  ]}
                />
              );
            })}
          </MobileRecordList>

          {data && data.totalElements > 0 ? (
            <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>
                  Showing{" "}
                  <b className="text-foreground">{first.toLocaleString()}</b>–
                  <b className="text-foreground">{last.toLocaleString()}</b> of{" "}
                  <b className="text-foreground">
                    {data.totalElements.toLocaleString()}
                  </b>
                </span>
                <Select
                  value={String(size)}
                  onValueChange={(value) => setSize(Number(value))}
                >
                  <SelectTrigger
                    size="sm"
                    className="w-24"
                    aria-label="Entries per page"
                  >
                    <SelectValue>
                      {(value: string) => `${value} / page`}
                    </SelectValue>
                  </SelectTrigger>
                  <SelectContent>
                    {PAGE_SIZES.map((option) => (
                      <SelectItem key={option} value={String(option)}>
                        {option} / page
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <Pager
                page={data.page}
                totalPages={data.totalPages}
                onChange={setPage}
              />
            </div>
          ) : null}
        </>
      )}

      <ActivityDetailsPanel
        entry={selectedEntry}
        onOpenChange={(open) => {
          if (!open) setSelectedEntry(null);
        }}
      />
    </div>
  );
}

function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  options: { value: string; label: string }[];
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Select value={value} onValueChange={(next) => onChange(String(next))}>
        <SelectTrigger className="h-10 w-44 bg-card" aria-label={label}>
          <SelectValue>
            {(current: string) =>
              options.find((o) => o.value === current)?.label ?? current
            }
          </SelectValue>
        </SelectTrigger>
        <SelectContent>
          {options.map((option) => (
            <SelectItem key={option.value} value={option.value}>
              {option.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </label>
  );
}

function DateFilter({
  label,
  value,
  onChange,
  min,
  max,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  min?: string;
  max?: string;
}) {
  return (
    <label className="space-y-1">
      <span className="block text-xs font-medium text-muted-foreground">
        {label}
      </span>
      <Input
        type="date"
        value={value}
        min={min}
        max={max}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-40 bg-card"
      />
    </label>
  );
}

/** Page buttons with gaps, so thousands of pages still fit on one line. */
function Pager({
  page,
  totalPages,
  onChange,
}: {
  page: number;
  totalPages: number;
  onChange: (page: number) => void;
}) {
  const pages = useMemo(() => {
    const wanted = new Set([0, totalPages - 1, page - 1, page, page + 1]);
    const sorted = [...wanted]
      .filter((p) => p >= 0 && p < totalPages)
      .sort((a, b) => a - b);
    const out: (number | "gap")[] = [];
    sorted.forEach((p, index) => {
      if (index > 0 && p - sorted[index - 1] > 1) out.push("gap");
      out.push(p);
    });
    return out;
  }, [page, totalPages]);

  return (
    <nav className="flex items-center gap-1" aria-label="Pages">
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(page - 1)}
        disabled={page === 0}
        aria-label="Previous page"
      >
        <ChevronLeft className="size-4" />
      </Button>
      {pages.map((p, index) =>
        p === "gap" ? (
          <span key={`gap-${index}`} className="px-1 text-muted-foreground">
            …
          </span>
        ) : (
          <Button
            key={p}
            type="button"
            variant={p === page ? "default" : "ghost"}
            size="icon"
            onClick={() => onChange(p)}
            aria-current={p === page ? "page" : undefined}
            className="min-w-9 px-2 tabular-nums"
          >
            {(p + 1).toLocaleString()}
          </Button>
        ),
      )}
      <Button
        type="button"
        variant="ghost"
        size="icon"
        onClick={() => onChange(page + 1)}
        disabled={page >= totalPages - 1}
        aria-label="Next page"
      >
        <ChevronRight className="size-4" />
      </Button>
    </nav>
  );
}
