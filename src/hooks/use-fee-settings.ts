import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformSettingsService } from "@/services/platform-settings.service";
import type { FeeSettings } from "@/lib/settings-data";

export function useFeeSettings() {
  return useQuery({
    queryKey: ["settings", "fees"],
    queryFn: () => platformSettingsService.getFeeSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateFeeSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: FeeSettings) =>
      platformSettingsService.updateFeeSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "fees"] });
    },
  });
}
