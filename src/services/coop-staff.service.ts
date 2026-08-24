import { apiClient } from "@/lib/axios";

export interface CoopRole {
  id: string;
  name: string;
  permissions: string[];
  status: "Active" | "Inactive";
  dateAdded: string;
}

export interface CoopUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: "Active" | "Inactive";
}

interface CoopRoleDto {
  id: string;
  name: string;
  permissions: string[];
  status: "Active" | "Inactive";
  dateAdded: string; // ISO datetime
}

function fromRoleDto(dto: CoopRoleDto): CoopRole {
  return {
    id: dto.id,
    name: dto.name,
    permissions: dto.permissions,
    status: dto.status,
    dateAdded: dto.dateAdded.slice(0, 10),
  };
}

/**
 * Admin's own Settings -> User Management, scoped to their co-op (a super admin can also manage
 * any co-op's, via the same {coopId}-scoped endpoints). Real backend only (CoopRoleController /
 * CoopUserController). Unlike platform staff, a "user" here is never created fresh — the admin
 * assigns a role to an EXISTING member (see Members Directory), which is why there's no
 * invite/resend-invite here, just assign/reassign/revoke.
 */
export const coopStaffService = {
  async getRoles(coopId: string): Promise<CoopRole[]> {
    const { data } = await apiClient.get<CoopRoleDto[]>(
      `/cooperatives/${coopId}/roles`,
    );
    return data.map(fromRoleDto);
  },

  async createRole(
    coopId: string,
    name: string,
    permissions: string[],
  ): Promise<CoopRole> {
    const { data } = await apiClient.post<CoopRoleDto>(
      `/cooperatives/${coopId}/roles`,
      {
        name,
        permissions,
      },
    );
    return fromRoleDto(data);
  },

  async updateRole(
    coopId: string,
    id: string,
    name: string,
    permissions: string[],
  ): Promise<CoopRole> {
    const { data } = await apiClient.patch<CoopRoleDto>(
      `/cooperatives/${coopId}/roles/${id}`,
      {
        name,
        permissions,
      },
    );
    return fromRoleDto(data);
  },

  async updateRoleStatus(
    coopId: string,
    id: string,
    status: "Active" | "Inactive",
  ): Promise<CoopRole> {
    const { data } = await apiClient.patch<CoopRoleDto>(
      `/cooperatives/${coopId}/roles/${id}/status`,
      { status },
    );
    return fromRoleDto(data);
  },

  async deleteRole(coopId: string, id: string): Promise<void> {
    await apiClient.delete(`/cooperatives/${coopId}/roles/${id}`);
  },

  async getUsers(coopId: string): Promise<CoopUser[]> {
    const { data } = await apiClient.get<CoopUser[]>(
      `/cooperatives/${coopId}/users`,
    );
    return data;
  },

  async assignRole(
    coopId: string,
    memberId: string,
    roleId: string,
  ): Promise<CoopUser> {
    const { data } = await apiClient.patch<CoopUser>(
      `/cooperatives/${coopId}/users/${memberId}/role`,
      { roleId },
    );
    return data;
  },

  async removeUser(coopId: string, memberId: string): Promise<void> {
    await apiClient.delete(`/cooperatives/${coopId}/users/${memberId}`);
  },
};
