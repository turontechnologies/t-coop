import { getRoleLabel } from "@/config/dashboard-nav";
import type {
  AuditAction,
  AuditModule,
  AuditStatus,
} from "@/lib/audit-log-data";
import { fetchApproximateLocation } from "@/lib/ip-location";
import { useAuditLogStore } from "@/store/audit-log.store";
import { useAuthStore } from "@/store/auth.store";

export interface LogActivityParams {
  module: AuditModule;
  action: AuditAction;
  resource: string;
  /** Defaults to "Success" — pass "Warning"/"Failed" for declines, blocked actions, etc. */
  status?: AuditStatus;
}

/**
 * Records one audit-log entry for the currently signed-in member, then
 * resolves an approximate IP-based location (and the public IP itself) in
 * the background and patches both into the entry once known. Callable from
 * anywhere — including inside Zustand store actions, which aren't React
 * components — since it reads `useAuthStore.getState()` directly rather
 * than via a hook.
 */
export function logActivity({
  module,
  action,
  resource,
  status = "Success",
}: LogActivityParams): void {
  const member = useAuthStore.getState().member;
  if (!member) return;

  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  useAuditLogStore.getState().addEntry({
    id,
    date: new Date().toISOString(),
    activityBy: member.name,
    role: getRoleLabel(member.role),
    module,
    action,
    resource,
    status,
    location: "Locating…",
    ipAddress: "Locating…",
  });

  fetchApproximateLocation()
    .then(({ location, ipAddress }) =>
      useAuditLogStore.getState().resolveLocation(id, location, ipAddress),
    )
    .catch(() =>
      useAuditLogStore.getState().resolveLocation(id, "Unknown", "Unknown"),
    );
}
