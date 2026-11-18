"use client";

import Link from "next/link";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  ExportImportMenu,
  type ImportResult,
} from "@/components/features/shared/export-import-menu";
import { useAlternativeIdLabel } from "@/components/features/shared/member-id";
import { QueryBoundary } from "@/components/features/shared/query-boundary";
import { MembersDirectoryTable } from "@/components/features/members-directory/members-directory-table";
import { useAddCoopMember, useCoopMembers } from "@/hooks/use-coop-members";
import { useModuleAccess } from "@/hooks/use-permission";
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
  const access = useModuleAccess("Members Directory");
  const coopId = authMember?.cooperativeId ?? authMember?.id;
  const {
    data: members = [],
    isLoading,
    isError,
    error,
    refetch,
    isRefetching,
  } = useCoopMembers(coopId);
  const addMember = useAddCoopMember(coopId as string);
  const altIdLabel = useAlternativeIdLabel(coopId);

  if (!authMember) return null;
  if (access === null) {
    return (
      <p className="pt-6 text-sm text-muted-foreground">
        Your role doesn&apos;t have access to Members Directory.
      </p>
    );
  }

  /** Adds each row; every new member is emailed their login details. Rows that fail are
   * listed with the reason, and members whose email didn't send are named. */
  const handleImport = async (
    importedRows: ImportedMemberRow[],
  ): Promise<ImportResult> => {
    let imported = 0;
    const errors: ImportResult["errors"] = [];
    const notEmailed: string[] = [];
    for (const row of importedRows) {
      try {
        const created = await addMember.mutateAsync({
          membershipId: row.membershipId,
          alternativeId: row.alternativeId || undefined,
          firstName: row.firstName,
          lastName: row.lastName,
          email: row.email,
          phone: row.phone,
          role: row.role,
          country: row.country,
          state: row.state,
          // Bank details and city aren't in the template; the admin adds them later via Edit.
          city: "",
          bankCode: "",
          accountNumber: "",
          accountName: "",
        });
        imported += 1;
        if (created.welcomeEmailSent === false) {
          notEmailed.push(`${row.firstName} ${row.lastName} (${row.email})`);
        }
      } catch (error) {
        errors.push({
          row: row.rowNumber,
          message:
            error instanceof Error
              ? error.message
              : "This member couldn't be added",
        });
      }
    }
    if (imported > 0) {
      if (notEmailed.length === 0) {
        toast.success("Login details emailed", {
          description: `Each of the ${imported} new member${imported === 1 ? "" : "s"} was sent an email with their Membership ID and password.`,
        });
      } else {
        toast.warning(
          `${notEmailed.length} welcome email${notEmailed.length === 1 ? "" : "s"} didn't send`,
          {
            description: `Give these members their login details yourself: ${notEmailed.slice(0, 3).join(", ")}${notEmailed.length > 3 ? ` and ${notEmailed.length - 3} more` : ""}.`,
            duration: 12_000,
          },
        );
      }
    }
    return { imported, errors };
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
              importConfig={
                access === "write"
                  ? {
                      templateStorageKey: "members-template-downloaded",
                      title: "Import members",
                      description:
                        "Add many members at once. Each new member gets an email with their Membership ID and password.",
                      downloadTemplate: () =>
                        downloadMemberImportTemplate(altIdLabel),
                      parseFile: (file) =>
                        parseMemberImportFile(file, members, altIdLabel),
                      onImport: handleImport,
                    }
                  : undefined
              }
            />
            {access === "write" ? (
              <Button
                nativeButton={false}
                render={<Link href="/members/new" />}
              >
                <Plus className="size-4" aria-hidden="true" />
                Add New Members
              </Button>
            ) : null}
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
        <MembersDirectoryTable
          coopId={coopId as string}
          members={members}
          readOnly={access !== "write"}
        />
      </QueryBoundary>
    </div>
  );
}
