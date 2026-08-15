import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformSettingsService } from "@/services/platform-settings.service";
import type { CollectionAccountSettings } from "@/lib/settings-data";

export function useCollectionAccount() {
  return useQuery({
    queryKey: ["settings", "collection-account"],
    queryFn: () => platformSettingsService.getCollectionAccount(),
    staleTime: 60_000,
  });
}

export function useUpdateCollectionAccount() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CollectionAccountSettings) =>
      platformSettingsService.updateCollectionAccount(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "collection-account"],
      });
    },
  });
}
