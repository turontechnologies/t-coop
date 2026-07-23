"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { MembersDirectoryTable } from "@/components/features/members-directory/members-directory-table";
import type { CoopMember } from "@/lib/coop-data";
import {
  ADMIN_DIRECTORY_COOP_ID,
  getDirectoryMembers,
} from "@/lib/member-directory";
import {
  downloadMemberImportTemplate,
  parseMemberImportFile,
  type ImportedMemberRow,
} from "@/lib/member-import";
import type { ExportColumn } from "@/lib/table-export";
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
  const addMember = useCoopStore((state) => state.addMember);
  const members = getDirectoryMembers(cooperatives);

  const handleImport = (importedRows: ImportedMemberRow[]) => {
    importedRows.forEach((row) => {
      const member: CoopMember = {
        id: row.membershipId,
        firstName: row.firstName,
        lastName: row.lastName,
        email: row.email,
        role: row.role,
        status: "Active",
        guarantor: row.guarantor,
        country: row.country,
        state: row.state,
        // Bulk import doesn't capture bank details — the admin adds these
        // later via Edit, same as any other field the template omits.
        city: "",
        bankCode: "",
        accountNumber: "",
        accountName: "",
      };
      addMember(ADMIN_DIRECTORY_COOP_ID, member);
    });
  };

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
              entityLabel="member"
              importConfig={{
                templateStorageKey: "members-template-downloaded",
                downloadTemplate: downloadMemberImportTemplate,
                parseFile: (file) =>
                  parseMemberImportFile(
                    file,
                    members.map((member) => member.id),
                  ),
                onImport: handleImport,
              }}
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
