"use client";

import { useState } from "react";
import {
  ChevronDown,
  Download,
  FileSpreadsheet,
  FileText,
  Table as TableIcon,
  Upload,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  exportToCsv,
  exportToExcel,
  exportToPdf,
  type ExportColumn,
} from "@/lib/table-export";
import type { ImportRowError } from "@/lib/table-import";
import {
  BulkUploadDialog,
  type BulkCheckResult,
  type BulkColumn,
} from "@/components/features/shared/bulk-upload-dialog";

/**
 * One import flow for the whole app: Export / Import → Import opens the same dialog everywhere —
 * download the template, upload it, see every row before anything is saved, then import.
 */
export interface ImportConfig<TImportRow> {
  /** Kept for older callers; the dialog shows the template step itself now. */
  templateStorageKey?: string;
  downloadTemplate: () => void;
  parseFile: (file: File) => Promise<{
    rows: TImportRow[];
    errors: ImportRowError[];
    skipped?: number;
  }>;
  /** Row-by-row importers: wrong rows are skipped and listed. */
  onImport?: (
    rows: TImportRow[],
  ) => void | ImportResult | Promise<void | ImportResult>;
  /** Server-checked imports (money): checked first, and any wrong row blocks the upload. */
  submit?: (
    rows: TImportRow[],
    dryRun: boolean,
  ) => Promise<BulkCheckResult<{ row: number }>>;
  /** How each row looks in the preview (server lines for `submit`, parsed rows otherwise). */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  columns?: BulkColumn<any>[];
  title?: string;
  description?: string;
  templateHint?: string;
  formatTotal?: (amount: number) => string;
}

export interface ImportResult {
  imported: number;
  errors: ImportRowError[];
}

interface ExportImportMenuProps<T, TImportRow> {
  rows: T[];
  columns: ExportColumn<T>[];
  filenamePrefix: string;
  exportTitle: string;
  /** Used in toast messages, e.g. "3 members imported" — defaults to "record". */
  entityLabel?: string;
  importConfig?: ImportConfig<TImportRow>;
}

export function ExportImportMenu<T, TImportRow = never>({
  rows,
  columns,
  filenamePrefix,
  exportTitle,
  entityLabel = "record",
  importConfig,
}: ExportImportMenuProps<T, TImportRow>) {
  const [importOpen, setImportOpen] = useState(false);

  const plural = (count: number) =>
    count === 1 ? entityLabel : `${entityLabel}s`;

  const handleExport = (format: "csv" | "excel" | "pdf") => {
    if (rows.length === 0) {
      toast.error("Nothing to export", {
        description: "There are no records matching the current view.",
      });
      return;
    }
    if (format === "csv") {
      exportToCsv(rows, columns, `${filenamePrefix}.csv`);
    } else if (format === "excel") {
      exportToExcel(rows, columns, `${filenamePrefix}.xlsx`);
    } else {
      exportToPdf(rows, columns, `${filenamePrefix}.pdf`, exportTitle);
    }
    toast.success("Export ready", {
      description: `${rows.length} ${plural(rows.length)} exported as ${format.toUpperCase()}.`,
    });
  };

  /** The preview row number of a parsed row (the importers call it rowNumber or row). */
  const rowOf = (row: TImportRow, index: number) => {
    const record = row as unknown as { row?: number; rowNumber?: number };
    return record.rowNumber ?? record.row ?? index + 2;
  };

  const submit = async (
    importRows: TImportRow[],
    dryRun: boolean,
  ): Promise<BulkCheckResult<{ row: number }>> => {
    if (!importConfig)
      return { totalAmount: 0, imported: 0, lines: [], errors: [] };
    if (importConfig.submit) return importConfig.submit(importRows, dryRun);
    if (dryRun) {
      return {
        totalAmount: 0,
        imported: 0,
        lines: importRows.map((data, index) => ({
          row: rowOf(data, index),
          data,
        })),
        errors: [],
      };
    }
    const result = await importConfig.onImport?.(importRows);
    return {
      totalAmount: 0,
      imported: result?.imported ?? importRows.length,
      lines: [],
      errors: result?.errors ?? [],
    };
  };

  // Row-by-row importers preview the parsed rows: their own columns, or the first few fields.
  const previewColumns: BulkColumn<{
    row: number;
    data?: Record<string, unknown>;
  }>[] = importConfig?.columns ?? [
    {
      header: "Details",
      cell: (line) =>
        Object.entries(line.data ?? {})
          .filter(
            ([key, value]) =>
              key !== "rowNumber" &&
              key !== "row" &&
              (typeof value === "string" || typeof value === "number") &&
              String(value).length > 0,
          )
          .slice(0, 4)
          .map(([, value]) => String(value))
          .join(" · "),
    },
  ];

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className="gap-1.5" />}
        >
          {importConfig ? (
            <Upload className="size-3.5" aria-hidden="true" />
          ) : (
            <Download className="size-3.5" aria-hidden="true" />
          )}
          {importConfig ? "Export / Import" : "Export"}
          <ChevronDown className="size-3.5" aria-hidden="true" />
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuGroup>
            <DropdownMenuLabel>Export</DropdownMenuLabel>
            <DropdownMenuItem onClick={() => handleExport("csv")}>
              <TableIcon className="size-4" aria-hidden="true" />
              Export as CSV
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("excel")}>
              <FileSpreadsheet className="size-4" aria-hidden="true" />
              Export as Excel
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => handleExport("pdf")}>
              <FileText className="size-4" aria-hidden="true" />
              Export as PDF
            </DropdownMenuItem>
          </DropdownMenuGroup>

          {importConfig ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Import</DropdownMenuLabel>
                <DropdownMenuItem onClick={() => setImportOpen(true)}>
                  <Upload className="size-4" aria-hidden="true" />
                  Import from a file…
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => importConfig.downloadTemplate()}
                >
                  <Download className="size-4" aria-hidden="true" />
                  Download the template
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {importConfig ? (
        <BulkUploadDialog<TImportRow, { row: number }>
          open={importOpen}
          onOpenChange={setImportOpen}
          title={importConfig.title ?? `Import ${entityLabel}s`}
          description={
            importConfig.description ??
            `Add ${entityLabel}s from a spreadsheet. You'll see every row before anything is saved.`
          }
          noun={plural(2)}
          downloadTemplate={importConfig.downloadTemplate}
          parseFile={importConfig.parseFile}
          submit={submit}
          columns={previewColumns}
          formatTotal={importConfig.formatTotal}
          templateHint={
            importConfig.templateHint ??
            "Fill it in without changing the column headings. Excel or CSV both work."
          }
          allOrNothing={Boolean(importConfig.submit)}
        />
      ) : null}
    </>
  );
}
