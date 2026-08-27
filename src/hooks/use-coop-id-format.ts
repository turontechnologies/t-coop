import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  platformSettingsService,
  type CoopIdFormat,
} from "@/services/platform-settings.service";

export function useCoopIdFormat() {
  return useQuery({
    queryKey: ["settings", "coop-id-format"],
    queryFn: () => platformSettingsService.getCoopIdFormat(),
    staleTime: 60_000,
  });
}

export function useUpdateCoopIdFormat() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (values: CoopIdFormat) =>
      platformSettingsService.updateCoopIdFormat(values),
    onSuccess: () => {
      queryClient.invalidateQueries({
        queryKey: ["settings", "coop-id-format"],
      });
    },
  });
}
