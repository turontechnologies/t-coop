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
import { CreateRoleModal } from "@/components/features/settings/create-role-modal";
import { EditUserModal } from "@/components/features/settings/edit-user-modal";
import { InviteUserModal } from "@/components/features/settings/invite-user-modal";
import { PlatformRolesTable } from "@/components/features/settings/platform-roles-table";
import { PlatformUsersTable } from "@/components/features/settings/platform-users-table";
import {
  usePlatformRoles,
  usePlatformStaffMutations,
  usePlatformUsers,
} from "@/hooks/use-platform-staff";
import type { PlatformRole, PlatformUser } from "@/lib/settings-data";
import type {
  CreateRoleFormValues,
  InviteUserFormValues,
} from "@/lib/validations/settings.schema";

type UserManagementTab = "users" | "roles";

/**
 * The real, super-admin-only backend behind Settings -> User Management — platform staff
 * (support accounts), invited by email, real login only after they accept. Reuses every
 * presentational piece the mock `SettingsUserManagementTab` already built (tables/modals all
 * take data via props), swapping `useSettingsStore` for real mutations against
 * PlatformRoleController/PlatformUserController. See documentation/flows.md for the invite
 * lifecycle. Admin's own Settings still uses the original mock tab, unchanged — platform staff
 * is a platform-wide concept, not a per-co-op one.
 */
export function SuperAdminUserManagementTab() {
  const [activeTab, setActiveTab] = useState<UserManagementTab>("users");
  const usersQuery = usePlatformUsers();
  const rolesQuery = usePlatformRoles();
  const users = usersQuery.data ?? [];
  const roles = rolesQuery.data ?? [];
  const mutations = usePlatformStaffMutations();

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<PlatformRole | null>(null);

  const busy =
    mutations.inviteUser.isPending ||
    mutations.updateUserRole.isPending ||
    mutations.createRole.isPending ||
    mutations.updateRole.isPending;

  const roleIdByName = (name: string) =>
    roles.find((role) => role.name === name)?.id;

  const handleInvite = async (values: InviteUserFormValues) => {
    const roleId = roleIdByName(values.role);
    if (!roleId) {
      toast.error("Select a valid role");
      return;
    }
    try {
      await mutations.inviteUser.mutateAsync({ email: values.email, roleId });
      setInviteOpen(false);
      toast.success("Invite sent", {
        description: `${values.email} was invited as ${values.role}. They'll get access once they accept.`,
      });
    } catch (error) {
      toast.error("Couldn't send invite", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleSaveUser = async (userId: string, roleName: string) => {
    const roleId = roleIdByName(roleName);
    if (!roleId) {
      toast.error("Select a valid role");
      return;
    }
    try {
      await mutations.updateUserRole.mutateAsync({ userId, roleId });
      setEditingUser(null);
      toast.success("User updated");
    } catch (error) {
      toast.error("Couldn't update user", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleToggleUserStatus = async (user: PlatformUser) => {
    const next = user.status === "Active" ? "Inactive" : "Active";
    try {
      await mutations.updateUserStatus.mutateAsync({
        userId: user.id,
        status: next,
      });
      toast.success(
        next === "Active" ? `${user.name} activated` : `${user.name} disabled`,
      );
    } catch (error) {
      toast.error("Couldn't update status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleResendInvite = async (user: PlatformUser) => {
    try {
      await mutations.resendInvite.mutateAsync(user.id);
      toast.success("Invite resent", { description: user.email });
    } catch (error) {
      toast.error("Couldn't resend invite", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
  };

  const handleRemoveUser = async (user: PlatformUser) => {
    try {
      await mutations.removeUser.mutateAsync(user.id);
      toast.success(`${user.name} removed`);
    } catch (error) {
      toast.error("Couldn't remove user", {
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

  const handleToggleRoleStatus = async (role: PlatformRole) => {
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

  const handleRemoveRole = async (role: PlatformRole) => {
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
              onClick={() => setInviteOpen(true)}
              disabled={roles.length === 0}
            >
              Invite Users
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
                Create a role first, then invite platform staff to it.
              </p>
            ) : (
              <PlatformUsersTable
                users={users}
                onEdit={setEditingUser}
                onToggleStatus={handleToggleUserStatus}
                onRemove={handleRemoveUser}
                onResendInvite={handleResendInvite}
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
            <PlatformRolesTable
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

      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={roles}
        busy={busy}
        onInvite={handleInvite}
      />
      <EditUserModal
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        roles={roles}
        busy={busy}
        onSave={handleSaveUser}
      />
      <CreateRoleModal
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
