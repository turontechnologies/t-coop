"use client";

import { useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  Tabs,
  TabsIndicator,
  TabsList,
  TabsPanel,
  TabsTab,
} from "@/components/ui/tabs";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { AssignCoopUserModal } from "@/components/features/settings/assign-coop-user-modal";
import { CoopRolesTable } from "@/components/features/settings/coop-roles-table";
import { CoopUsersTable } from "@/components/features/settings/coop-users-table";
import { CreateCoopRoleModal } from "@/components/features/settings/create-coop-role-modal";
import { EditCoopUserModal } from "@/components/features/settings/edit-coop-user-modal";
import { useCoopMembers } from "@/hooks/use-coop-members";
import {
  useCoopRoles,
  useCoopStaffMutations,
  useCoopUsers,
} from "@/hooks/use-coop-staff";
import type { AssignCoopRoleFormValues } from "@/lib/validations/admin-settings.schema";
import type { CreateRoleFormValues } from "@/lib/validations/settings.schema";
import { useAuthStore } from "@/store/auth.store";
import type { CoopRole, CoopUser } from "@/services/coop-staff.service";

type UserManagementTab = "users" | "roles";

/**
 * Admin's own Settings -> User Management, scoped entirely to their own co-op. Mirrors
 * SuperAdminUserManagementTab's shape (users/roles sub-tabs, same table/modal split) but with one
 * key difference: a "user" here is never created fresh — the admin assigns a CoopRole to an
 * EXISTING member (see Members Directory for adding a person in the first place), so they keep
 * logging in with their existing membership ID and password. Real backend only
 * (CoopRoleController / CoopUserController).
 */
export function SettingsUserManagementTab() {
  const member = useAuthStore((state) => state.member);
  const coopId = member?.id;

  const [activeTab, setActiveTab] = useState<UserManagementTab>("users");
  const membersQuery = useCoopMembers(coopId);
  const usersQuery = useCoopUsers(coopId);
  const rolesQuery = useCoopRoles(coopId);
  const members = membersQuery.data ?? [];
  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const mutations = useCoopStaffMutations(coopId ?? "");

  const [assignOpen, setAssignOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<CoopUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<CoopRole | null>(null);

  const busy =
    mutations.assignRole.isPending ||
    mutations.createRole.isPending ||
    mutations.updateRole.isPending;

  const handleAssign = async (values: AssignCoopRoleFormValues) => {
    try {
      await mutations.assignRole.mutateAsync(values);
      setAssignOpen(false);
      toast.success("Role assigned");
    } catch (error) {
      toast.error("Couldn't assign role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleSaveUser = async (memberId: string, roleId: string) => {
    try {
      await mutations.assignRole.mutateAsync({ memberId, roleId });
      setEditingUser(null);
      toast.success("Role updated");
    } catch (error) {
      toast.error("Couldn't update role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleRemoveUser = async (user: CoopUser) => {
    try {
      await mutations.removeUser.mutateAsync(user.id);
      toast.success(`${user.name}'s role was removed`);
    } catch (error) {
      toast.error("Couldn't remove role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleRoleSubmit = async (values: CreateRoleFormValues) => {
    try {
      if (editingRole) {
        await mutations.updateRole.mutateAsync({
          id: editingRole.id,
          name: values.roleName,
          permissions: values.permissions,
        });
        toast.success("Role updated", { description: values.roleName });
      } else {
        await mutations.createRole.mutateAsync({
          name: values.roleName,
          permissions: values.permissions,
        });
        toast.success("Role created", { description: values.roleName });
      }
      setRoleModalOpen(false);
      setEditingRole(null);
    } catch (error) {
      toast.error(
        editingRole ? "Couldn't update role" : "Couldn't create role",
        {
          description:
            error instanceof Error ? error.message : "Please try again.",
        },
      );
    }
  };

  const handleToggleRoleStatus = async (role: CoopRole) => {
    const next = role.status === "Active" ? "Inactive" : "Active";
    try {
      await mutations.updateRoleStatus.mutateAsync({
        id: role.id,
        status: next,
      });
      toast.success(
        next === "Active" ? `${role.name} activated` : `${role.name} disabled`,
      );
    } catch (error) {
      toast.error("Couldn't update role", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleRemoveRole = async (role: CoopRole) => {
    try {
      await mutations.deleteRole.mutateAsync(role.id);
      toast.success(`${role.name} removed`);
    } catch (error) {
      toast.error("Can't remove that role", {
        description:
          error instanceof Error
            ? error.message
            : `${role.name} is still assigned to at least one user — reassign them first.`,
      });
    }
  };

  return (
    <>
      <Tabs
        value={activeTab}
        onValueChange={(value) => setActiveTab(value as UserManagementTab)}
      >
        <div className="flex flex-wrap items-center justify-between gap-3">
          <TabsList>
            <TabsTab value="users">Users</TabsTab>
            <TabsTab value="roles">Roles</TabsTab>
            <TabsIndicator />
          </TabsList>
          {activeTab === "users" ? (
            <Button
              onClick={() => setAssignOpen(true)}
              disabled={roles.length === 0}
            >
              Assign Role
            </Button>
          ) : (
            <Button
              onClick={() => {
                setEditingRole(null);
                setRoleModalOpen(true);
              }}
            >
              Create Role
            </Button>
          )}
        </div>

        <TabsPanel value="users">
          <QueryBoundary
            isLoading={usersQuery.isLoading}
            isError={usersQuery.isError}
            error={usersQuery.error}
            onRetry={() => usersQuery.refetch()}
            isRetrying={usersQuery.isFetching}
          >
            {roles.length === 0 && users.length === 0 ? (
              <p className="rounded-lg bg-muted px-3 py-2.5 text-sm text-muted-foreground">
                Create a role first, then assign it to one of your members.
              </p>
            ) : (
              <CoopUsersTable
                users={users}
                onEdit={setEditingUser}
                onRemove={handleRemoveUser}
              />
            )}
          </QueryBoundary>
        </TabsPanel>
        <TabsPanel value="roles">
          <QueryBoundary
            isLoading={rolesQuery.isLoading}
            isError={rolesQuery.isError}
            error={rolesQuery.error}
            onRetry={() => rolesQuery.refetch()}
            isRetrying={rolesQuery.isFetching}
          >
            <CoopRolesTable
              roles={roles}
              users={users}
              onEdit={(role) => {
                setEditingRole(role);
                setRoleModalOpen(true);
              }}
              onToggleStatus={handleToggleRoleStatus}
              onRemove={handleRemoveRole}
            />
          </QueryBoundary>
        </TabsPanel>
      </Tabs>

      <AssignCoopUserModal
        open={assignOpen}
        onOpenChange={setAssignOpen}
        members={members}
        users={users}
        roles={roles}
        busy={busy}
        onAssign={handleAssign}
      />
      <EditCoopUserModal
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        roles={roles}
        busy={busy}
        onSave={handleSaveUser}
      />
      <CreateCoopRoleModal
        open={roleModalOpen}
        onOpenChange={(open) => {
          setRoleModalOpen(open);
          if (!open) setEditingRole(null);
        }}
        editingRole={editingRole}
        busy={busy}
        onSubmit={handleRoleSubmit}
      />
    </>
  );
}
