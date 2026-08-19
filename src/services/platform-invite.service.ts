import { apiClient } from "@/lib/axios";
import type { AuthenticatedMember } from "@/types/auth";

export interface InviteInfo {
  email: string;
  roleName: string;
}

export interface AcceptInviteValues {
  token: string;
  firstName: string;
  lastName: string;
  password: string;
}

export interface AcceptInviteResult {
  token: string;
  member: AuthenticatedMember;
}

/** The public (unauthenticated) side of the platform-staff invite flow —
 * see documentation/flows.md. */
export const platformInviteService = {
  async getInvite(token: string): Promise<InviteInfo> {
    const { data } = await apiClient.get<InviteInfo>(
      `/platform-invites/${encodeURIComponent(token)}`,
    );
    return data;
  },

  async acceptInvite(values: AcceptInviteValues): Promise<AcceptInviteResult> {
    const { data } = await apiClient.post<AcceptInviteResult>(
      "/platform-invites/accept",
      values,
    );
    return data;
  },
};
