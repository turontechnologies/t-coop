import { CheckCircle2, User } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { RecentActivity } from "@/lib/dashboard-data";

interface RecentActivitiesProps {
  activities: RecentActivity[];
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
                {activity.showStatus ? (
                  <p className="mt-0.5 flex items-center gap-1 text-xs font-medium text-success">
                    <CheckCircle2 className="size-3" aria-hidden="true" />
                    Success
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
