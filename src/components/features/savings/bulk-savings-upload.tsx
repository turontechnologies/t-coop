"use client";

import type { ImportConfig } from "@/components/features/shared/export-import-menu";
import { useAlternativeIdLabel } from "@/components/features/shared/member-id";
import { memberLookup } from "@/lib/import-template";
import { useCoopMembers } from "@/hooks/use-coop-members";
import { useCoopSavingsTypes } from "@/hooks/use-coop-savings";
import { useBulkSavingsUpload } from "@/hooks/use-savings-self";
import {
  downloadBulkSavingsTemplate,
  parseBulkSavingsFile,
} from "@/lib/bulk-upload";
import { formatDateLong, formatMoney } from "@/lib/format";
import type {
  BulkSavingsLine,
  BulkSavingsRow,
} from "@/services/savings-self.service";

/**
 * Savings import for the shared Export / Import menu: a template pre-filled with every active
 * member, checked by the server before anything is saved (all or nothing).
 */
export function useBulkSavingsImport(
  coopId: string,
  currency: string,
): ImportConfig<BulkSavingsRow> {
  const { data: members = [] } = useCoopMembers(coopId);
  const { data: types = [] } = useCoopSavingsTypes(coopId);
  const bulk = useBulkSavingsUpload(coopId);
  const lookup = memberLookup(members, useAlternativeIdLabel(coopId));
  const activeTypes = types
    .filter((type) => type.status === "Active")
    .map((type) => type.name);

  return {
    title: "Import savings",
    description:
      "Record savings for many members at once. Savings charges apply to each row as for a teller upload.",
    templateHint:
      "Every active member is already listed. Just type how much each person saved. Empty rows are left out.",
    downloadTemplate: () =>
      downloadBulkSavingsTemplate(members, activeTypes, lookup),
    parseFile: (file) => parseBulkSavingsFile(file, lookup),
    submit: (rows, dryRun) => bulk.mutateAsync({ rows, dryRun }),
    formatTotal: (amount) => formatMoney(amount, currency),
    columns: [
      {
        header: "Member",
        cell: (line: BulkSavingsLine) => (
          <>
            <span className="block font-medium">{line.memberName}</span>
            <span className="text-xs text-muted-foreground">
              {line.memberId}
            </span>
          </>
        ),
      },
      {
        header: "Savings type",
        cell: (line: BulkSavingsLine) => line.savingsType,
      },
      {
        header: "Date",
        cell: (line: BulkSavingsLine) => formatDateLong(new Date(line.date)),
      },
      {
        header: "Amount",
        align: "right",
        cell: (line: BulkSavingsLine) => formatMoney(line.amount, currency),
      },
      {
        header: "Credited",
        align: "right",
        cell: (line: BulkSavingsLine) => (
          <>
            {formatMoney(line.net, currency)}
            {line.charge > 0 ? (
              <span className="block text-xs text-muted-foreground">
                after {formatMoney(line.charge, currency)} charge
              </span>
            ) : null}
          </>
        ),
      },
    ],
  };
}
