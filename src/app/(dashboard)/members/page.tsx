"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportImportMenu } from "@/components/features/savings/export-import-menu";
import { MembersDirectoryTable } from "@/components/features/members-directory/members-directory-table";
import { getDirectoryMembers } from "@/lib/member-directory";
import type { ExportColumn } from "@/lib/table-export";
import type { CoopMember } from "@/lib/coop-data";
import { useCoopStore } from "@/store/coop.store";

const EXPORT_COLUMNS: ExportColumn<CoopMember>[] = [
  { header: "Members Id", accessor: (member) => member.id },
  { header: "First Name", accessor: (member) => member.firstName },
  { header: "Last Name", accessor: (member) => member.lastName },
  { header: "Email Address", accessor: (member) => member.email },
  { header: "Status", accessor: (member) => member.status },
];

export default function MembersDirectoryPage() {
  const cooperatives = useCoopStore((state) => state.cooperatives);
  const members = getDirectoryMembers(cooperatives);

  return (
    <div className="space-y-6 pt-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex flex-1 flex-wrap items-center justify-end gap-3 sm:justify-between">
          <h2 className="text-sm font-semibold text-foreground">
            Quick Summary
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <ExportImportMenu
              rows={members}
              columns={EXPORT_COLUMNS}
              filenamePrefix="members-directory"
              exportTitle="Members Directory"
            />
            <Button nativeButton={false} render={<Link href="/members/new" />}>
              <Plus className="size-4" aria-hidden="true" />
              Add New Members
            </Button>
          </div>
        </div>
      </div>

      <MembersDirectoryTable members={members} />
    </div>
  );
}
