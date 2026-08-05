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
import { CreateRoleModal } from "@/components/features/settings/create-role-modal";
import { EditUserModal } from "@/components/features/settings/edit-user-modal";
import { InviteUserModal } from "@/components/features/settings/invite-user-modal";
import { PlatformRolesTable } from "@/components/features/settings/platform-roles-table";
import { PlatformUsersTable } from "@/components/features/settings/platform-users-table";
import { logActivity } from "@/lib/audit-log";
import type { PlatformRole, PlatformUser } from "@/lib/settings-data";
import type {
  CreateRoleFormValues,
  InviteUserFormValues,
} from "@/lib/validations/settings.schema";
import { useSettingsStore } from "@/store/settings.store";

type UserManagementTab = "users" | "roles";

export function SettingsUserManagementTab() {
  const [activeTab, setActiveTab] = useState<UserManagementTab>("users");
  const platformUsers = useSettingsStore((state) => state.platformUsers);
  const platformRoles = useSettingsStore((state) => state.platformRoles);
  const inviteUser = useSettingsStore((state) => state.inviteUser);
  const updatePlatformUserRole = useSettingsStore(
    (state) => state.updatePlatformUserRole,
  );
  const setPlatformUserStatus = useSettingsStore(
    (state) => state.setPlatformUserStatus,
  );
  const removePlatformUser = useSettingsStore(
    (state) => state.removePlatformUser,
  );
  const createRole = useSettingsStore((state) => state.createRole);
  const updatePlatformRole = useSettingsStore(
    (state) => state.updatePlatformRole,
  );
  const setPlatformRoleStatus = useSettingsStore(
    (state) => state.setPlatformRoleStatus,
  );
  const removePlatformRole = useSettingsStore(
    (state) => state.removePlatformRole,
  );

  const [inviteOpen, setInviteOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PlatformUser | null>(null);
  const [roleModalOpen, setRoleModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState<PlatformRole | null>(null);
  const [busy, setBusy] = useState(false);

  const handleInvite = async (values: InviteUserFormValues) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const user: PlatformUser = {
      id: `usr-${Date.now()}`,
      name: values.email.split("@")[0],
      email: values.email,
      role: values.role,
      dateAdded: new Date().toISOString().slice(0, 10),
      status: "Active",
    };
    inviteUser(user);
    setBusy(false);
    setInviteOpen(false);
    toast.success("User invited", {
      description: `${values.email} was added as ${values.role}.`,
    });
  };

  const handleSaveUser = async (userId: string, role: string) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 500));
    updatePlatformUserRole(userId, role);
    setBusy(false);
    setEditingUser(null);
    toast.success("User updated");
  };

  const handleToggleUserStatus = async (user: PlatformUser) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = user.status === "Active" ? "Inactive" : "Active";
    setPlatformUserStatus(user.id, next);
    toast.success(
      next === "Active" ? `${user.name} activated` : `${user.name} disabled`,
    );
  };

  const handleRemoveUser = (user: PlatformUser) => {
    removePlatformUser(user.id);
    toast.success(`${user.name} removed`);
  };

  const handleRoleSubmit = async (values: CreateRoleFormValues) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    if (editingRole) {
      updatePlatformRole(editingRole.id, {
        name: values.roleName,
        permissions: values.permissions,
      });
      toast.success("Role updated", { description: values.roleName });
    } else {
      const role: PlatformRole = {
        id: `role-${Date.now()}`,
        name: values.roleName,
        permissions: values.permissions,
        dateAdded: new Date().toISOString().slice(0, 10),
        status: "Active",
      };
      createRole(role);
      toast.success("Role created", { description: values.roleName });
    }
    setBusy(false);
    setRoleModalOpen(false);
    setEditingRole(null);
  };

  const handleToggleRoleStatus = async (role: PlatformRole) => {
    await new Promise((resolve) => setTimeout(resolve, 400));
    const next = role.status === "Active" ? "Inactive" : "Active";
    setPlatformRoleStatus(role.id, next);
    toast.success(
      next === "Active" ? `${role.name} activated` : `${role.name} disabled`,
    );
  };

  const handleRemoveRole = (role: PlatformRole) => {
    const inUse = platformUsers.some((user) => user.role === role.name);
    if (inUse) {
      logActivity({
        module: "Users",
        action: "Delete",
        resource: role.name,
        status: "Failed",
      });
      toast.error("Can't remove that role", {
        description: `${role.name} is still assigned to at least one user — reassign them first.`,
      });
      return;
    }
    removePlatformRole(role.id);
    toast.success(`${role.name} removed`);
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
            <Button onClick={() => setInviteOpen(true)}>Invite Users</Button>
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
          <PlatformUsersTable
            users={platformUsers}
            onEdit={setEditingUser}
            onToggleStatus={handleToggleUserStatus}
            onRemove={handleRemoveUser}
          />
        </TabsPanel>
        <TabsPanel value="roles">
          <PlatformRolesTable
            roles={platformRoles}
            users={platformUsers}
            onEdit={(role) => {
              setEditingRole(role);
              setRoleModalOpen(true);
            }}
            onToggleStatus={handleToggleRoleStatus}
            onRemove={handleRemoveRole}
          />
        </TabsPanel>
      </Tabs>

      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={platformRoles}
        busy={busy}
        onInvite={handleInvite}
      />
      <EditUserModal
        user={editingUser}
        onOpenChange={(open) => {
          if (!open) setEditingUser(null);
        }}
        roles={platformRoles}
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
