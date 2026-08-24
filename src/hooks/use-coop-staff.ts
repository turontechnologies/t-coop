import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { coopStaffService } from "@/services/coop-staff.service";

export function useCoopRoles(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-roles", coopId],
    queryFn: () => coopStaffService.getRoles(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopUsers(coopId: string | undefined) {
  return useQuery({
    queryKey: ["coop-users", coopId],
    queryFn: () => coopStaffService.getUsers(coopId as string),
    enabled: Boolean(coopId),
    staleTime: 30_000,
  });
}

export function useCoopStaffMutations(coopId: string) {
  const queryClient = useQueryClient();
  const invalidateRoles = () =>
    queryClient.invalidateQueries({ queryKey: ["coop-roles", coopId] });
  const invalidateUsers = () =>
    queryClient.invalidateQueries({ queryKey: ["coop-users", coopId] });

  const createRole = useMutation({
    mutationFn: ({
      name,
      permissions,
    }: {
      name: string;
      permissions: string[];
    }) => coopStaffService.createRole(coopId, name, permissions),
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
    }) => coopStaffService.updateRole(coopId, id, name, permissions),
    onSuccess: invalidateRoles,
  });

  const updateRoleStatus = useMutation({
    mutationFn: ({
      id,
      status,
    }: {
      id: string;
      status: "Active" | "Inactive";
    }) => coopStaffService.updateRoleStatus(coopId, id, status),
    onSuccess: invalidateRoles,
  });

  const deleteRole = useMutation({
    mutationFn: (id: string) => coopStaffService.deleteRole(coopId, id),
    onSuccess: invalidateRoles,
  });

  const assignRole = useMutation({
    mutationFn: ({ memberId, roleId }: { memberId: string; roleId: string }) =>
      coopStaffService.assignRole(coopId, memberId, roleId),
    onSuccess: invalidateUsers,
  });

  const removeUser = useMutation({
    mutationFn: (memberId: string) =>
      coopStaffService.removeUser(coopId, memberId),
    onSuccess: invalidateUsers,
  });

  return {
    createRole,
    updateRole,
    updateRoleStatus,
    deleteRole,
    assignRole,
    removeUser,
  };
}
