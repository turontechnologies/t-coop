import { getRoleLabel } from "@/config/dashboard-nav";
import { fetchApproximateLocation } from "@/lib/ip-location";
import { useAuditLogStore } from "@/store/audit-log.store";
import { useAuthStore } from "@/store/auth.store";

/**
 * Records one audit-log entry for the currently signed-in member, then
 * resolves an approximate IP-based location in the background and patches
 * it into the entry once known. Callable from anywhere — including inside
 * Zustand store actions, which aren't React components — since it reads
 * `useAuthStore.getState()` directly rather than via a hook.
 */
export function logActivity(activity: string): void {
  const member = useAuthStore.getState().member;
  if (!member) return;

  const id = `log-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

  useAuditLogStore.getState().addEntry({
    id,
    activity,
    activityBy: member.name,
    role: getRoleLabel(member.role),
    date: new Date().toISOString(),
    location: "Locating…",
  });

  fetchApproximateLocation()
    .then((location) =>
      useAuditLogStore.getState().updateLocation(id, location),
    )
    .catch(() => useAuditLogStore.getState().updateLocation(id, "Unknown"));
}
