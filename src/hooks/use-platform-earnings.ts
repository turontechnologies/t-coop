import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformSettingsService } from "@/services/platform-settings.service";
import type { CoopPlatformFeesFormValues } from "@/lib/validations/settings.schema";

/** Super admin: every co-operative's platform fees. */
export function useCoopPlatformFees() {
  return useQuery({
    queryKey: ["platform-fees"],
    queryFn: () => platformSettingsService.getCoopPlatformFees(),
    staleTime: 30_000,
  });
}

export function useUpdateCoopPlatformFees() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({
      cooperativeId,
      values,
    }: {
      cooperativeId: string;
      values: CoopPlatformFeesFormValues;
    }) => platformSettingsService.updateCoopPlatformFees(cooperativeId, values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["platform-fees"] });
    },
  });
}

/** Super admin: what the platform earned from each co-op between two dates (YYYY-MM-DD). */
export function usePlatformEarnings(from: string, to: string) {
  return useQuery({
    queryKey: ["platform-earnings", from, to],
    queryFn: () => platformSettingsService.getEarnings(from, to),
    staleTime: 30_000,
  });
}

export function useCoopEarnings(
  cooperativeId: string | null,
  from: string,
  to: string,
) {
  return useQuery({
    queryKey: ["platform-earnings", cooperativeId, from, to],
    queryFn: () =>
      platformSettingsService.getCoopEarnings(
        cooperativeId as string,
        from,
        to,
      ),
    enabled: !!cooperativeId,
  });
}
