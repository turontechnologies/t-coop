import { apiClient } from "@/lib/axios";

/** A co-op's own payment gateways (admin's Settings -> Integrations). Secret keys are write-only:
 * the backend only ever says whether one is saved, never what it is. */
export interface CoopIntegrations {
  paystackEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKeySet: boolean;
  flutterwaveEnabled: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKeySet: boolean;
  updatedAt: string | null;
}

/** A blank secret key keeps the one already saved. */
export interface UpdateCoopIntegrationsPayload {
  paystackEnabled: boolean;
  paystackPublicKey: string;
  paystackSecretKey: string;
  flutterwaveEnabled: boolean;
  flutterwavePublicKey: string;
  flutterwaveSecretKey: string;
}

/** Real backend only — `CoopIntegrationsController`. */
export const coopIntegrationsService = {
  async get(coopId: string): Promise<CoopIntegrations> {
    const { data } = await apiClient.get<CoopIntegrations>(
      `/cooperatives/${coopId}/integrations`,
    );
    return data;
  },

  async update(
    coopId: string,
    payload: UpdateCoopIntegrationsPayload,
  ): Promise<CoopIntegrations> {
    const { data } = await apiClient.patch<CoopIntegrations>(
      `/cooperatives/${coopId}/integrations`,
      payload,
    );
    return data;
  },
};
