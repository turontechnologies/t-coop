import { AlertCircle, CheckCircle2, Clock, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivity } from "@/lib/dashboard-data";
import { cn } from "@/lib/utils";

interface RecentActivitiesProps {
  activities: RecentActivity[];
}

const SUCCESS_STATUSES = new Set([
  "Success",
  "Active",
  "Completed",
  "Approved",
]);
const FAILURE_STATUSES = new Set(["Failed", "Rejected", "Declined"]);

function statusTone(status: string) {
  if (SUCCESS_STATUSES.has(status)) return "success" as const;
  if (FAILURE_STATUSES.has(status)) return "destructive" as const;
  return "pending" as const;
}

export function RecentActivities({ activities }: RecentActivitiesProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Recent Activities</CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="divide-y divide-border">
          {activities.map((activity, index) => (
            <li
              key={`${activity.title}-${index}`}
              className="flex items-start gap-3 py-3 first:pt-0 last:pb-0"
            >
              <span className="flex size-9 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <User className="size-4.5" aria-hidden="true" />
              </span>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-medium text-foreground">
                  {activity.title}
                </p>
                <p className="truncate text-xs text-muted-foreground">
                  {activity.subtitle}
                </p>
                {activity.status ? (
                  <p
                    className={cn(
                      "mt-0.5 flex items-center gap-1 text-xs font-medium",
                      statusTone(activity.status) === "success" &&
                        "text-success",
                      statusTone(activity.status) === "destructive" &&
                        "text-destructive",
                      statusTone(activity.status) === "pending" &&
                        "text-muted-foreground",
                    )}
                  >
                    {statusTone(activity.status) === "success" ? (
                      <CheckCircle2 className="size-3" aria-hidden="true" />
                    ) : statusTone(activity.status) === "destructive" ? (
                      <AlertCircle className="size-3" aria-hidden="true" />
                    ) : (
                      <Clock className="size-3" aria-hidden="true" />
                    )}
                    {activity.status}
                  </p>
                ) : null}
              </div>
              <div className="shrink-0 text-right">
                <p className="text-sm font-semibold text-foreground">
                  {activity.amount}
                </p>
                <p className="text-xs text-muted-foreground">{activity.date}</p>
              </div>
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
