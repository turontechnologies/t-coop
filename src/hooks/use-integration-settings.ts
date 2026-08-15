import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformSettingsService } from "@/services/platform-settings.service";
import type { IntegrationSettings } from "@/lib/settings-data";

export function useIntegrationSettings() {
  return useQuery({
    queryKey: ["settings", "integrations"],
    queryFn: () => platformSettingsService.getIntegrationSettings(),
    staleTime: 60_000,
  });
}

export function useUpdateIntegrationSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: IntegrationSettings) =>
      platformSettingsService.updateIntegrationSettings(values),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["settings", "integrations"] });
    },
  });
}
