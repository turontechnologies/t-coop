"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  MobileRecordCard,
  MobileRecordList,
} from "@/components/ui/mobile-record-card";
import { TablePagination } from "@/components/ui/table-pagination";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import { EditMemberModal } from "@/components/features/coop/edit-member-modal";
import { MemberAvatar } from "@/components/features/coop/member-avatar";
import {
  useUpdateCoopMember,
  useUpdateCoopMemberStatus,
} from "@/hooks/use-coop-members";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { cn } from "@/lib/utils";

interface MembersDirectoryTableProps {
  coopId: string;
  members: CoopMember[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function MembersDirectoryTable({
  coopId,
  members,
}: MembersDirectoryTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingMember, setEditingMember] = useState<CoopMember | null>(null);
  const updateStatus = useUpdateCoopMemberStatus(coopId);
  const updateMember = useUpdateCoopMember(coopId);

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return members;
    return members.filter(
      (member) =>
        coopMemberFullName(member).toLowerCase().includes(query) ||
        member.email.toLowerCase().includes(query) ||
        member.id.toLowerCase().includes(query),
    );
  }, [members, search]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / pageSize));
  const currentPage = Math.min(page, totalPages);
  const pageMembers = filtered.slice(
    (currentPage - 1) * pageSize,
    currentPage * pageSize,
  );

  const handleToggleStatus = async (member: CoopMember) => {
    const isActive = member.status === "Active";
    const fullName = coopMemberFullName(member);
    const next = isActive ? "Inactive" : "Active";
    try {
      await updateStatus.mutateAsync({ memberId: member.id, status: next });
      toast.success(
        next === "Active" ? `${fullName} activated` : `${fullName} disabled`,
      );
    } catch (error) {
      toast.error("Couldn't update status", {
        description:
          error instanceof Error ? error.message : "Please try again.",
      });
    }
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
          onChange={(event) => {
            setSearch(event.target.value);
            setPage(1);
          }}
          placeholder="Search"
          className="h-9 pl-8"
        />
      </div>

      {/* Desktop table */}
      <div className="hidden overflow-x-auto rounded-xl border border-border sm:block">
        <table className="w-full min-w-[720px] text-left text-sm">
          <thead>
            <tr className="border-b border-border bg-accent/60">
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">Photo</span>
              </th>
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
              <th className="px-4 py-2.5 font-medium text-foreground">
                Status
              </th>
              <th className="px-4 py-2.5 font-medium text-foreground">
                <span className="sr-only">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {pageMembers.length === 0 ? (
              <tr>
                <td
                  colSpan={7}
                  className="px-4 py-8 text-center text-muted-foreground"
                >
                  No members match your search.
                </td>
              </tr>
            ) : (
              pageMembers.map((member) => {
                const isActive = member.status === "Active";
                return (
                  <tr
                    key={member.id}
                    onClick={() => router.push(`/members/${member.id}`)}
                    className="cursor-pointer border-b border-border last:border-0 hover:bg-muted/50"
                  >
                    <td className="px-4 py-3">
                      <MemberAvatar
                        avatarUrl={member.avatarUrl}
                        name={coopMemberFullName(member)}
                      />
                    </td>
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
                    <td className="px-4 py-3">
                      <Badge
                        variant={isActive ? "secondary" : "outline"}
                        className={cn(isActive && "bg-success/15 text-success")}
                      >
                        {member.status}
                      </Badge>
                    </td>
                    <td className="px-4 py-3">
                      <MemberRowActions
                        member={member}
                        onEdit={() => setEditingMember(member)}
                        onToggle={() => handleToggleStatus(member)}
                      />
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <MobileRecordList
        isEmpty={pageMembers.length === 0}
        emptyMessage="No members match your search."
      >
        {pageMembers.map((member) => {
          const isActive = member.status === "Active";
          return (
            <MobileRecordCard
              key={member.id}
              onClick={() => router.push(`/members/${member.id}`)}
              title={
                <span className="flex items-center gap-2">
                  <MemberAvatar
                    avatarUrl={member.avatarUrl}
                    name={coopMemberFullName(member)}
                    className="size-6"
                  />
                  {coopMemberFullName(member)}
                </span>
              }
              badge={
                <Badge
                  variant={isActive ? "secondary" : "outline"}
                  className={cn(isActive && "bg-success/15 text-success")}
                >
                  {member.status}
                </Badge>
              }
              fields={[
                { label: "Member Id", value: member.id },
                { label: "First Name", value: member.firstName },
                { label: "Last Name", value: member.lastName },
                { label: "Email Address", value: member.email },
              ]}
              actions={
                <MemberRowActions
                  member={member}
                  onEdit={() => setEditingMember(member)}
                  onToggle={() => handleToggleStatus(member)}
                />
              }
            />
          );
        })}
      </MobileRecordList>

      {filtered.length > 0 ? (
        <TablePagination
          page={currentPage}
          totalPages={totalPages}
          pageSize={pageSize}
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          onPageChange={setPage}
          onPageSizeChange={(size) => {
            setPageSize(size);
            setPage(1);
          }}
        />
      ) : null}

      {editingMember ? (
        <EditMemberModal
          member={editingMember}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingMember(null);
          }}
          onSubmit={async (values) => {
            await updateMember.mutateAsync({
              memberId: editingMember.id,
              values,
            });
          }}
        />
      ) : null}
    </div>
  );
}

function MemberRowActions({
  member,
  onEdit,
  onToggle,
}: {
  member: CoopMember;
  onEdit: () => void;
  onToggle: () => Promise<void> | void;
}) {
  const isActive = member.status === "Active";
  const fullName = coopMemberFullName(member);

  return (
    <div className="flex items-center gap-1">
      <button
        type="button"
        onClick={(event) => {
          event.stopPropagation();
          onEdit();
        }}
        className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
        aria-label={`Edit ${fullName}`}
      >
        <Pencil className="size-3.5" aria-hidden="true" />
      </button>
      <ConfirmToggleDialog
        trigger={
          <button
            type="button"
            onClick={(event) => event.stopPropagation()}
            className="flex size-7 items-center justify-center rounded-md text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
            aria-label={
              isActive ? `Disable ${fullName}` : `Activate ${fullName}`
            }
          />
        }
        entityLabel="Member"
        name={fullName}
        isActive={isActive}
        onConfirm={onToggle}
      >
        <Power className="size-3.5" aria-hidden="true" />
      </ConfirmToggleDialog>
    </div>
  );
}
