"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronLeft, ChevronRight, Pencil, Power, Search } from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ConfirmToggleDialog } from "@/components/features/coop/confirm-toggle-dialog";
import { EditMemberModal } from "@/components/features/coop/edit-member-modal";
import { coopMemberFullName, type CoopMember } from "@/lib/coop-data";
import { ADMIN_DIRECTORY_COOP_ID } from "@/lib/member-directory";
import { useCoopStore } from "@/store/coop.store";
import { cn } from "@/lib/utils";

interface MembersDirectoryTableProps {
  members: CoopMember[];
}

const PAGE_SIZE_OPTIONS = [5, 10, 25];

export function MembersDirectoryTable({ members }: MembersDirectoryTableProps) {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [pageSize, setPageSize] = useState(10);
  const [page, setPage] = useState(1);
  const [editingMember, setEditingMember] = useState<CoopMember | null>(null);
  const setMemberStatus = useCoopStore((state) => state.setMemberStatus);

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
    await new Promise((resolve) => setTimeout(resolve, 500));
    const next = isActive ? "Inactive" : "Active";
    setMemberStatus(ADMIN_DIRECTORY_COOP_ID, member.id, next);
    toast.success(
      next === "Active" ? `${fullName} activated` : `${fullName} disabled`,
    );
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
                  colSpan={6}
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

      {/* Mobile stacked cards */}
      <div className="space-y-3 sm:hidden">
        {pageMembers.length === 0 ? (
          <div className="rounded-xl border border-border px-4 py-8 text-center text-sm text-muted-foreground">
            No members match your search.
          </div>
        ) : (
          pageMembers.map((member) => {
            const isActive = member.status === "Active";
            const goToMember = () => router.push(`/members/${member.id}`);
            return (
              <div
                key={member.id}
                role="button"
                tabIndex={0}
                onClick={goToMember}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    goToMember();
                  }
                }}
                className="w-full cursor-pointer space-y-2 rounded-xl border border-border bg-card p-4 text-left text-sm"
              >
                <MobileField label="Member Id" value={member.id} />
                <MobileField label="First Name" value={member.firstName} />
                <MobileField label="Last Name" value={member.lastName} />
                <MobileField label="Email Address" value={member.email} />
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Status</span>
                  <Badge
                    variant={isActive ? "secondary" : "outline"}
                    className={cn(isActive && "bg-success/15 text-success")}
                  >
                    {member.status}
                  </Badge>
                </div>
                <div className="flex items-center justify-between border-t border-border pt-2">
                  <span className="text-xs text-muted-foreground">Actions</span>
                  <MemberRowActions
                    member={member}
                    onEdit={() => setEditingMember(member)}
                    onToggle={() => handleToggleStatus(member)}
                  />
                </div>
              </div>
            );
          })
        )}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 text-sm text-muted-foreground">
        <div className="flex items-center gap-1.5">
          <span>View</span>
          <Select
            value={String(pageSize)}
            onValueChange={(value) => {
              setPageSize(Number(value));
              setPage(1);
            }}
          >
            <SelectTrigger size="sm" className="w-16">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {PAGE_SIZE_OPTIONS.map((size) => (
                <SelectItem key={size} value={String(size)}>
                  {size}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <span>per page</span>
        </div>

        <div className="flex items-center gap-1">
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={currentPage === 1}
            className="text-muted-foreground"
            aria-label="Previous page"
          >
            <ChevronLeft className="size-4" />
          </Button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <Button
              key={num}
              type="button"
              variant={num === currentPage ? "default" : "ghost"}
              size="icon"
              onClick={() => setPage(num)}
              className="text-sm font-medium"
            >
              {num}
            </Button>
          ))}
          <Button
            type="button"
            variant="ghost"
            size="icon"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={currentPage === totalPages}
            className="text-muted-foreground"
            aria-label="Next page"
          >
            <ChevronRight className="size-4" />
          </Button>
        </div>
      </div>

      {editingMember ? (
        <EditMemberModal
          coopId={ADMIN_DIRECTORY_COOP_ID}
          member={editingMember}
          open={true}
          onOpenChange={(open) => {
            if (!open) setEditingMember(null);
          }}
        />
      ) : null}
    </div>
  );
}

function MobileField({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-xs text-muted-foreground">{label}</span>
      <span className="font-medium text-foreground">{value}</span>
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
