"use client";

import { useEffect, useRef, useState } from "react";
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
import {
  downloadSavingsImportTemplate,
  parseSavingsImportFile,
  type ImportedSavingsRow,
} from "@/lib/savings-import";

interface ExportImportMenuProps<T> {
  rows: T[];
  columns: ExportColumn<T>[];
  filenamePrefix: string;
  exportTitle: string;
  onImport?: (rows: ImportedSavingsRow[]) => void;
}

export function ExportImportMenu<T>({
  rows,
  columns,
  filenamePrefix,
  exportTitle,
  onImport,
}: ExportImportMenuProps<T>) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [templateDownloaded, setTemplateDownloaded] = useState(false);

  useEffect(() => {
    setTemplateDownloaded(
      sessionStorage.getItem("savings-template-downloaded") === "true",
    );
  }, []);

  const handleDownloadTemplate = () => {
    downloadSavingsImportTemplate();
    sessionStorage.setItem("savings-template-downloaded", "true");
    setTemplateDownloaded(true);
  };

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
      description: `${rows.length} record${rows.length === 1 ? "" : "s"} exported as ${format.toUpperCase()}.`,
    });
  };

  const handleFileSelected = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file || !onImport) return;

    try {
      const { rows: parsedRows, errors } = await parseSavingsImportFile(file);

      if (parsedRows.length > 0) {
        onImport(parsedRows);
      }

      if (errors.length === 0 && parsedRows.length > 0) {
        toast.success("Import complete", {
          description: `${parsedRows.length} record${parsedRows.length === 1 ? "" : "s"} imported.`,
        });
      } else if (parsedRows.length > 0 && errors.length > 0) {
        toast.warning("Import finished with some rows skipped", {
          description: `${parsedRows.length} imported, ${errors.length} skipped — row ${errors[0].row}: ${errors[0].message}${errors.length > 1 ? `, +${errors.length - 1} more` : ""}`,
        });
      } else {
        toast.error("Nothing imported", {
          description:
            errors[0]?.message ??
            "The file didn't match the template — download it again and fill it in without changing the headers.",
        });
      }
    } catch {
      toast.error("Couldn't read that file", {
        description:
          "Make sure it's the downloaded template (.xlsx) or a .csv exported from it.",
      });
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger
          render={<Button variant="outline" size="sm" className="gap-1.5" />}
        >
          <Upload className="size-3.5" aria-hidden="true" />
          Export / Import
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

          {onImport ? (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuGroup>
                <DropdownMenuLabel>Import</DropdownMenuLabel>
                <DropdownMenuItem onClick={handleDownloadTemplate}>
                  <Download className="size-4" aria-hidden="true" />
                  Download import template
                </DropdownMenuItem>
                <DropdownMenuItem
                  disabled={!templateDownloaded}
                  onClick={() => fileInputRef.current?.click()}
                >
                  <Upload className="size-4" aria-hidden="true" />
                  {templateDownloaded
                    ? "Import from template"
                    : "Import (download the template first)"}
                </DropdownMenuItem>
              </DropdownMenuGroup>
            </>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>

      {onImport ? (
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          className="hidden"
          onChange={handleFileSelected}
        />
      ) : null}
    </>
  );
}
