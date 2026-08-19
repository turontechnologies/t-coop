import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { platformStaffService } from "@/services/platform-staff.service";

const ROLES_KEY = ["platform-roles"];
const USERS_KEY = ["platform-users"];

export function usePlatformRoles() {
  return useQuery({
    queryKey: ROLES_KEY,
    queryFn: () => platformStaffService.getRoles(),
    staleTime: 30_000,
  });
}

export function usePlatformUsers() {
  return useQuery({
    queryKey: USERS_KEY,
    queryFn: () => platformStaffService.getUsers(),
    staleTime: 30_000,
  });
}

export function usePlatformStaffMutations() {
  const queryClient = useQueryClient();
  const invalidateRoles = () =>
    queryClient.invalidateQueries({ queryKey: ROLES_KEY });
  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: USERS_KEY });

  const createRole = useMutation({
    mutationFn: ({
      name,
      permissions,
    }: {
      name: string;
      permissions: string[];
    }) => platformStaffService.createRole(name, permissions),
    onSuccess: invalidateRoles,
  });

  const updateRole = useMutation({
    mutationFn: ({
      id,
      name,
      permissions,
    }: {
      id: string;
      name: string;
      permissions: string[];
    }) => platformStaffService.updateRole(id, name, permissions),
    onSuccess: invalidateRoles,
  });

  const updateRoleStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "Active" | "Inactive";
    }) => platformStaffService.updateRoleStatus(id, status),
    onSuccess: invalidateRoles,
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => platformStaffService.deleteRole(id),
    onSuccess: invalidateRoles,
  });

  const inviteUser = useMutation({
    mutationFn: ({ email, roleId }: { email: string; roleId: string }) =>
      platformStaffService.inviteUser(email, roleId),
    onSuccess: invalidateUsers,
  });

  const updateUserRole = useMutation({
    mutationFn: ({ userId, roleId }: { userId: string; roleId: string }) =>
      platformStaffService.updateUserRole(userId, roleId),
    onSuccess: invalidateUsers,
  });

  const updateUserStatus = useMutation({
    mutationFn: ({
      userId,
      status,
    }: {
      userId: string;
      status: "Active" | "Inactive";
    }) => platformStaffService.updateUserStatus(userId, status),
    onSuccess: invalidateUsers,
  });

  const resendInvite = useMutation({
    mutationFn: (userId: string) => platformStaffService.resendInvite(userId),
  });

  const removeUser = useMutation({
    mutationFn: (userId: string) => platformStaffService.removeUser(userId),
    onSuccess: invalidateUsers,
  });

  return {
    createRole,
    updateRole,
    updateRoleStatus,
    deleteRole,
    inviteUser,
    updateUserRole,
    updateUserStatus,
    resendInvite,
    removeUser,
  };
}
