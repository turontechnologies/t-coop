import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  coopIntegrationsService,
  type UpdateCoopIntegrationsPayload,
} from "@/services/coop-integrations.service";

export function useCoopIntegrations(coopId: string | undefined) {
  return useQuery({
    queryKey: ["cooperatives", coopId, "integrations"],
    queryFn: () => coopIntegrationsService.get(coopId as string),
    enabled: !!coopId,
    staleTime: 60_000,
  });
}

export function useUpdateCoopIntegrations(coopId: string | undefined) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateCoopIntegrationsPayload) =>
      coopIntegrationsService.update(coopId as string, payload),
    onSuccess: (data) => {
      queryClient.setQueryData(["cooperatives", coopId, "integrations"], data);
    },
  });
}
