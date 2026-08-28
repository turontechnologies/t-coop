"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ExportImportMenu } from "@/components/features/shared/export-import-menu";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { MembersDirectoryTable } from "@/components/features/members-directory/members-directory-table";
import { useAddCoopMember, useCoopMembers } from "@/hooks/use-coop-members";
import type { CoopMember } from "@/lib/coop-data";
import {
  downloadMemberImportTemplate,
  parseMemberImportFile,
  type ImportedMemberRow,
} from "@/lib/member-import";
import type { ExportColumn } from "@/lib/table-export";
import { useAuthStore } from "@/store/auth.store";

const EXPORT_COLUMNS: ExportColumn<CoopMember>[] = [
  { header: "Members Id", accessor: (member) => member.id },
  { header: "First Name", accessor: (member) => member.firstName },
  { header: "Last Name", accessor: (member) => member.lastName },
  { header: "Email Address", accessor: (member) => member.email },
  { header: "Status", accessor: (member) => member.status },
];

export default function MembersDirectoryPage() {
  const authMember = useAuthStore((state) => state.member);
  const coopId = authMember?.id;
  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopMembers(coopId);
  const addMember = useAddCoopMember(coopId as string);

  if (!authMember) return null;

  const handleImport = async (importedRows: ImportedMemberRow[]) => {
    let succeeded = 0;
    let failed = 0;
    for (const row of importedRows) {
      try {
        await addMember.mutateAsync({
          membershipId: row.membershipId,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          role: row.role,
          // Bulk import only captures one guarantor NAME per row (the CSV template has no
          // guarantor email/phone columns), and every guarantor now needs both to receive their
          // accept invite — these rows will fail the same validation Add Member goes through;
          // they just count toward `failed` below, same as any other incomplete row.
          guarantors: [{ name: row.guarantor, email: "", phone: "" }],
          country: row.country,
          state: row.state,
          // Bulk import doesn't capture bank details or city — the admin adds these later via
          // Edit, same as any other field the template omits.
          city: "",
          bankCode: "",
          accountNumber: "",
          accountName: "",
        });
        succeeded += 1;
      } catch {
        failed += 1;
      }
    }
    if (succeeded > 0) {
      toast.success(`${succeeded} member${succeeded === 1 ? "" : "s"} added`);
    }
    if (failed > 0) {
      toast.error(
        `${failed} row${failed === 1 ? "" : "s"} couldn't be added — check for duplicate IDs/emails and try again.`,
      );
    }
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

      <QueryBoundary
        isLoading={isLoading}
        isError={isError}
        error={error}
        onRetry={() => refetch()}
        isRetrying={isRefetching}
        errorTitle="Couldn't load the members directory"
      >
        <MembersDirectoryTable coopId={coopId as string} members={members} />
      </QueryBoundary>
    </div>
  );
}
