import { apiClient } from "@/lib/axios";
import type { PlatformRole, PlatformUser } from "@/lib/settings-data";

interface PlatformRoleDto {
  id: string;
  name: string;
  permissions: string[];
  status: "Active" | "Inactive";
  dateAdded: string; // ISO datetime
}

function fromRoleDto(dto: PlatformRoleDto): PlatformRole {
  return {
    id: dto.id,
    name: dto.name,
    permissions: dto.permissions,
    status: dto.status,
    dateAdded: dto.dateAdded.slice(0, 10),
  };
}

/**
 * Settings -> User Management, super admin only — real backend (PlatformRoleController /
 * PlatformUserController). No mock fallback: this feature has always been built real-backend-
 * first, and simulating a real invite-by-email/accept-invite flow offline would be more
 * misleading than useful. Only reachable when signed in as super_admin — see
 * SuperAdminUserManagementTab.
 */
export const platformStaffService = {
  async getRoles(): Promise<PlatformRole[]> {
    const { data } = await apiClient.get<PlatformRoleDto[]>("/platform-roles");
    return data.map(fromRoleDto);
  },

  async createRole(name: string, permissions: string[]): Promise<PlatformRole> {
    const { data } = await apiClient.post<PlatformRoleDto>("/platform-roles", {
      name,
      permissions,
    });
    return fromRoleDto(data);
  },

  async updateRole(
    id: string,
    name: string,
    permissions: string[],
  ): Promise<PlatformRole> {
    const { data } = await apiClient.patch<PlatformRoleDto>(
      `/platform-roles/${id}`,
      {
        name,
        permissions,
      },
    );
    return fromRoleDto(data);
  },

  async updateRoleStatus(
    id: string,
    status: "Active" | "Inactive",
  ): Promise<PlatformRole> {
    const { data } = await apiClient.patch<PlatformRoleDto>(
      `/platform-roles/${id}/status`,
      { status },
    );
    return fromRoleDto(data);
  },

  async deleteRole(id: string): Promise<void> {
    await apiClient.delete(`/platform-roles/${id}`);
  },

  async getUsers(): Promise<PlatformUser[]> {
    const { data } = await apiClient.get<PlatformUser[]>("/platform-users");
    return data;
  },

  async inviteUser(email: string, roleId: string): Promise<PlatformUser> {
    const { data } = await apiClient.post<PlatformUser>(
      "/platform-users/invite",
      {
        email,
        roleId,
      },
    );
    return data;
  },

  async updateUserRole(userId: string, roleId: string): Promise<PlatformUser> {
    const { data } = await apiClient.patch<PlatformUser>(
      `/platform-users/${userId}/role`,
      { roleId },
    );
    return data;
  },

  async updateUserStatus(
    userId: string,
    status: "Active" | "Inactive",
  ): Promise<PlatformUser> {
    const { data } = await apiClient.patch<PlatformUser>(
      `/platform-users/${userId}/status`,
      { status },
    );
    return data;
  },

  async resendInvite(userId: string): Promise<void> {
    await apiClient.post(`/platform-users/${userId}/resend-invite`);
  },

  async removeUser(userId: string): Promise<void> {
    await apiClient.delete(`/platform-users/${userId}`);
  },
};
