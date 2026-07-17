import { jsPDF } from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";

export interface ExportColumn<T> {
  header: string;
  accessor: (row: T) => string | number;
}

function triggerDownload(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = filename;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

function toAoa<T>(rows: T[], columns: ExportColumn<T>[]) {
  return [
    columns.map((column) => column.header),
    ...rows.map((row) => columns.map((column) => column.accessor(row))),
  ];
}

export function exportToCsv<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
) {
  const sheet = XLSX.utils.aoa_to_sheet(toAoa(rows, columns));
  const csv = XLSX.utils.sheet_to_csv(sheet);
  triggerDownload(
    new Blob([csv], { type: "text/csv;charset=utf-8;" }),
    filename,
  );
}

export function exportToExcel<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  sheetName = "Sheet1",
) {
  const sheet = XLSX.utils.aoa_to_sheet(toAoa(rows, columns));
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, sheetName);
  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    filename,
  );
}

export function exportToPdf<T>(
  rows: T[],
  columns: ExportColumn<T>[],
  filename: string,
  title: string,
) {
  const doc = new jsPDF();
  doc.setFontSize(13);
  doc.text(title, 14, 15);
  autoTable(doc, {
    startY: 21,
    head: [columns.map((column) => column.header)],
    body: rows.map((row) =>
      columns.map((column) => String(column.accessor(row))),
    ),
    styles: { fontSize: 9 },
    headStyles: { fillColor: [15, 76, 60] },
  });
  doc.save(filename);
}

export { triggerDownload };
