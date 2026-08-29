import { useQuery } from "@tanstack/react-query";
import { platformSettingsService } from "@/services/platform-settings.service";

/** Unlike {@link useFeeSettings}, this is safe for any authenticated member — it's backed by
 * `GET /settings/withdrawal-fee`, which only exposes the platform's withdrawal fee rather than
 * the full super-admin-only settings row. Used wherever a member needs to see the real platform
 * fee alongside their co-op's own (e.g. the withdrawal request modal). */
export function useWithdrawalFeeSettings() {
  return useQuery({
    queryKey: ["settings", "withdrawal-fee"],
    queryFn: () => platformSettingsService.getWithdrawalFee(),
    staleTime: 60_000,
  });
}
