import { apiClient } from "@/lib/axios";

export interface GuarantorInviteInfo {
  guarantorName: string;
  memberName: string;
  cooperativeName: string;
  status: "Pending" | "Accepted" | "Declined";
}

/** The public (unauthenticated) side of the guarantor accept-workflow — a guarantor never has
 * their own T-Coop account, so this token is the entire interaction. See
 * GuarantorInviteController on the backend. */
export const guarantorInviteService = {
  async getInvite(token: string): Promise<GuarantorInviteInfo> {
    const { data } = await apiClient.get<GuarantorInviteInfo>(
      `/guarantor-invites/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async accept(token: string): Promise<{ status: string }> {
    const { data } = await apiClient.post<{ status: string }>(
      "/guarantor-invites/accept",
      { token },
    );
    return data;
  },

  async decline(token: string): Promise<{ status: string }> {
    const { data } = await apiClient.post<{ status: string }>(
      "/guarantor-invites/decline",
      { token },
    );
    return data;
  },
};
