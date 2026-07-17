"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  coopMemberFullName,
  type CoopMember,
  type Cooperative,
} from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface CoopMembersTableProps {
  coop: Cooperative;
}

export function CoopMembersTable({ coop }: CoopMembersTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const setMemberStatus = useCoopStore((state) => state.setMemberStatus);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return coop.members;
    return coop.members.filter(
      (member) =>
        coopMemberFullName(member).toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query),
    );
  }, [coop.members, search]);

  const handleToggleStatus = (event: React.MouseEvent, member: CoopMember) => {
    event.stopPropagation();
    const next = member.status === "Active" ? "Inactive" : "Active";
    setMemberStatus(coop.id, member.id, next);
    toast.success(
      next === "Active"
        ? `${coopMemberFullName(member)} activated`
        : `${coopMemberFullName(member)} deactivated`,
    );
  };

  const handleEdit = (event: React.MouseEvent, member: CoopMember) => {
    event.stopPropagation();
    toast.info("Coming soon", {
      description: `Editing ${coopMemberFullName(member)} isn't wired up yet.`,
    });
  };

  return (
    <div className="space-y-4">
      <div className="relative w-full max-w-xs">
        <Search
          className="pointer-events-none absolute top-1/2 left-2.5 size-3.5 -translate-y-1/2 text-muted-foreground"
          aria-hidden="true"
        />
        <Input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Search"
          className="h-9 pl-8"
        />
      </div>

      <div className="overflow-x-auto rounded-xl border border-border">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                Members Id
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                First Name
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Last Name
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Email Address
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">Role</th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No members match your search.
                </td>
              </tr>
            ) : (
              filtered.map((member) => (
                <tr
                  key={member.id}
                  onClick={() =>
                    router.push(
                      `/co-operatives/${coop.id}/members/${member.id}`,
                    )
                  }
                  className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                >
                  <td className="px-4 py-3 font-medium text-foreground">
                    {member.id}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {member.firstName}
                  </td>
                  <td className="px-4 py-3 text-foreground">
                    {member.lastName}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.email}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {member.role}
                  </td>
                  <td className="px-4 py-3">
                    <Badge
                      variant={
                        member.status === "Active" ? "secondary" : "outline"
                      }
                      className={cn(
                        member.status === "Active" &&
                          "bg-success/15 text-success",
                      )}
                    >
                      {member.status}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={(event) => handleEdit(event, member)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={`Edit ${coopMemberFullName(member)}`}
                      >
                        <Pencil className="size-3.5" aria-hidden="true" />
                      </button>
                      <button
                        type="button"
                        onClick={(event) => handleToggleStatus(event, member)}
                        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
                        aria-label={
                          member.status === "Active"
                            ? `Deactivate ${coopMemberFullName(member)}`
                            : `Activate ${coopMemberFullName(member)}`
                        }
                      >
                        <Power className="size-3.5" aria-hidden="true" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
