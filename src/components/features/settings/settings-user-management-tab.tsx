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
import { InviteUserModal } from "@/components/features/settings/invite-user-modal";
import { PlatformRolesTable } from "@/components/features/settings/platform-roles-table";
import { PlatformUsersTable } from "@/components/features/settings/platform-users-table";
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
  const createRole = useSettingsStore((state) => state.createRole);

  const [inviteOpen, setInviteOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
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

  const handleCreateRole = async (values: CreateRoleFormValues) => {
    setBusy(true);
    await new Promise((resolve) => setTimeout(resolve, 600));
    const role: PlatformRole = {
      id: `role-${Date.now()}`,
      name: values.roleName,
      permissions: values.permissions,
      dateAdded: new Date().toISOString().slice(0, 10),
      status: "Active",
    };
    createRole(role);
    setBusy(false);
    setRoleOpen(false);
    toast.success("Role created", { description: values.roleName });
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
            <Button onClick={() => setRoleOpen(true)}>Create Role</Button>
          )}
        </div>

        <TabsPanel value="users">
          <PlatformUsersTable users={platformUsers} />
        </TabsPanel>
        <TabsPanel value="roles">
          <PlatformRolesTable roles={platformRoles} />
        </TabsPanel>
      </Tabs>

      <InviteUserModal
        open={inviteOpen}
        onOpenChange={setInviteOpen}
        roles={platformRoles}
        busy={busy}
        onInvite={handleInvite}
      />
      <CreateRoleModal
        open={roleOpen}
        onOpenChange={setRoleOpen}
        busy={busy}
        onCreate={handleCreateRole}
      />
    </>
  );
}
