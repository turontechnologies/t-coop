"use client";

import { BulkUploadDialog } from "@/components/features/shared/bulk-upload-dialog";
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

/** Savings → Bulk upload: many members' savings, from one pre-filled spreadsheet. */
export function BulkSavingsUploadDialog({
  coopId,
  currency,
  open,
  onOpenChange,
}: {
  coopId: string;
  currency: string;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) {
  const { data: members = [] } = useCoopMembers(coopId);
  const { data: types = [] } = useCoopSavingsTypes(coopId);
  const bulk = useBulkSavingsUpload(coopId);
  const activeTypes = types
    .filter((type) => type.status === "Active")
    .map((type) => type.name);

  return (
    <BulkUploadDialog<BulkSavingsRow, BulkSavingsLine>
      open={open}
      onOpenChange={onOpenChange}
      title="Bulk upload savings"
      description="Record savings for many members at once, from one spreadsheet. Savings charges apply to each row as for a teller upload."
      noun="savings"
      downloadTemplate={() => downloadBulkSavingsTemplate(members, activeTypes)}
      parseFile={parseBulkSavingsFile}
      submit={(rows, dryRun) => bulk.mutateAsync({ rows, dryRun })}
      formatTotal={(amount) => formatMoney(amount, currency)}
      columns={[
        {
          header: "Member",
          cell: (line) => (
            <>
              <span className="block font-medium">{line.memberName}</span>
              <span className="text-xs text-muted-foreground">
                {line.memberId}
              </span>
            </>
          ),
        },
        { header: "Savings type", cell: (line) => line.savingsType },
        {
          header: "Date",
          cell: (line) => formatDateLong(new Date(line.date)),
        },
        {
          header: "Amount",
          align: "right",
          cell: (line) => formatMoney(line.amount, currency),
        },
        {
          header: "Credited",
          align: "right",
          cell: (line) => (
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
      ]}
    />
  );
}
