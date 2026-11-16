import Link from "next/link";
import { AlertCircle, ArrowRight, CheckCircle2, Clock } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivity } from "@/lib/dashboard-data";
import { getInitials } from "@/lib/format";
import { cn } from "@/lib/utils";

const SUCCESS = new Set(["Success", "Active", "Completed", "Approved"]);
const FAILURE = new Set(["Failed", "Rejected", "Declined"]);

/**
 * The super admin's recent activity: the same data as RecentActivities, as a timeline that
 * matches the console's cards and links through to the full activity log.
 */
export function ConsoleRecentActivity({
  activities,
}: {
  activities: RecentActivity[];
}) {
  return (
    <Card className="h-full rounded-3xl">
      <CardHeader>
        <div className="flex items-center justify-between gap-3">
          <CardTitle>Recent activity</CardTitle>
          <Link
            href="/settings#logs"
            className="inline-flex items-center gap-1 text-xs font-semibold text-primary hover:underline"
          >
            Full activity log
            <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
      </CardHeader>
      <CardContent>
        {activities.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted-foreground">
            Nothing has happened yet.
          </p>
        ) : (
          <ol className="relative space-y-3 before:absolute before:top-2 before:bottom-2 before:left-[17px] before:w-px before:bg-border">
            {activities.map((activity, index) => {
              const tone = !activity.status
                ? null
                : SUCCESS.has(activity.status)
                  ? "success"
                  : FAILURE.has(activity.status)
                    ? "destructive"
                    : "pending";
              const Icon =
                tone === "success"
                  ? CheckCircle2
                  : tone === "destructive"
                    ? AlertCircle
                    : Clock;
              return (
                <li
                  key={`${activity.title}-${index}`}
                  className="relative flex items-start gap-3"
                >
                  <span className="relative z-10 flex size-9 shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-emerald-500 to-emerald-700 text-[11px] font-semibold text-white ring-4 ring-card">
                    {getInitials(activity.title)}
                  </span>
                  <div className="min-w-0 flex-1 rounded-2xl bg-muted/50 px-3 py-2">
                    <div className="flex items-baseline justify-between gap-2">
                      <p className="truncate text-sm font-medium text-foreground">
                        {activity.title}
                      </p>
                      <p className="shrink-0 text-sm font-semibold text-foreground tabular-nums">
                        {activity.amount}
                      </p>
                    </div>
                    <div className="flex items-center justify-between gap-2 text-xs text-muted-foreground">
                      <span className="truncate">{activity.subtitle}</span>
                      <span className="shrink-0">{activity.date}</span>
                    </div>
                    {tone ? (
                      <p
                        className={cn(
                          "mt-0.5 flex items-center gap-1 text-xs font-medium",
                          tone === "success" && "text-success",
                          tone === "destructive" && "text-destructive",
                          tone === "pending" && "text-muted-foreground",
                        )}
                      >
                        <Icon className="size-3" aria-hidden="true" />
                        {activity.status}
                      </p>
                    ) : null}
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </CardContent>
    </Card>
  );
}
