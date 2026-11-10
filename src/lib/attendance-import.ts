import * as XLSX from "xlsx";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import { responseLabel } from "@/lib/meeting";
import {
  ATTENDANCE_LABELS,
  type MeetingAttendanceMark,
  type MeetingRegister,
} from "@/types/notice";

/**
 * Excel round-trip for a meeting's attendance sheet: download a template pre-filled with
 * everyone the meeting notice reached, fill in the Attendance column (e.g. typed up from a paper
 * register), upload it back. Blank Attendance leaves that member as they are.
 */
const HEADERS = [
  "Membership ID",
  "Member",
  "Said beforehand",
  "Attendance",
  "Note",
];

export interface ImportedAttendanceRow {
  rowNumber: number;
  memberId: string;
  attendance: MeetingAttendanceMark;
  note: string | null;
}

function toMark(raw: string): MeetingAttendanceMark | null | undefined {
  const value = raw
    .trim()
    .toLowerCase()
    .replace(/[\s_-]+/g, "");
  if (!value) return null;
  if (["inperson", "present", "physical", "p"].includes(value))
    return "Present";
  if (["online", "presentonline", "virtual", "o"].includes(value))
    return "PresentOnline";
  if (["absent", "a", "notpresent"].includes(value)) return "Absent";
  return undefined;
}

export function downloadAttendanceTemplate(register: MeetingRegister) {
  const rows = register.entries.map((entry) => [
    entry.memberId,
    entry.memberName,
    responseLabel(entry.response),
    entry.attendance ? ATTENDANCE_LABELS[entry.attendance] : "",
    entry.attendanceNote ?? "",
  ]);
  const sheet = XLSX.utils.aoa_to_sheet([HEADERS, ...rows]);
  sheet["!cols"] = [
    { wch: 16 },
    { wch: 28 },
    { wch: 20 },
    { wch: 14 },
    { wch: 40 },
  ];

  const reference = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    [
      "Meeting",
      `${register.title} — ${register.meetingDate ?? ""} ${register.meetingTime ?? ""}`,
    ],
    [
      "Membership ID",
      "Don't change — it identifies the member. Only people invited to this meeting are listed.",
    ],
    [
      "Attendance",
      'One of: "In person", "Online", "Absent". Leave blank to keep that member as they are.',
    ],
    ["Note", "Optional — e.g. the reason someone was absent."],
    [
      "When",
      "Attendance can be uploaded only while the meeting's attendance is open.",
    ],
  ]);
  reference["!cols"] = [{ wch: 16 }, { wch: 100 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, sheet, "Attendance");
  XLSX.utils.book_append_sheet(workbook, reference, "Field Reference");
  const safeTitle = register.title
    .replace(/[^\w-]+/g, "-")
    .toLowerCase()
    .slice(0, 40);
  XLSX.writeFile(
    workbook,
    `attendance-${safeTitle}-${register.meetingDate ?? "template"}.xlsx`,
  );
}

export async function parseAttendanceFile(
  file: File,
  register: MeetingRegister,
): Promise<ParsedImportResult<ImportedAttendanceRow>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "attendance") ??
    workbook.SheetNames[0];
  const sheet = sheetName ? workbook.Sheets[sheetName] : undefined;
  if (!sheet)
    return {
      rows: [],
      errors: [{ row: 1, message: "The file has no worksheet" }],
    };

  const invited = new Set(
    register.entries.map((entry) => entry.memberId.toLowerCase()),
  );
  const raw = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });
  const rows: ImportedAttendanceRow[] = [];
  const errors: ImportRowError[] = [];
  const seen = new Set<string>();

  raw.forEach((record, index) => {
    const rowNumber = index + 2;
    const memberId = String(record["Membership ID"] ?? "").trim();
    const attendanceRaw = String(record["Attendance"] ?? "");
    const note = String(record["Note"] ?? "").trim();
    if (!memberId && !attendanceRaw.trim()) return;

    if (!memberId) {
      errors.push({ row: rowNumber, message: "Membership ID is missing" });
      return;
    }
    if (!invited.has(memberId.toLowerCase())) {
      errors.push({
        row: rowNumber,
        message: `${memberId} wasn't invited to this meeting`,
      });
      return;
    }
    if (seen.has(memberId.toLowerCase())) {
      errors.push({
        row: rowNumber,
        message: `${memberId} appears more than once`,
      });
      return;
    }
    seen.add(memberId.toLowerCase());

    const attendance = toMark(attendanceRaw);
    if (attendance === undefined) {
      errors.push({
        row: rowNumber,
        message: `"${attendanceRaw.trim()}" isn't a valid attendance — use In person, Online or Absent`,
      });
      return;
    }
    if (attendance === null) return; // blank: leave as is

    const canonical =
      register.entries.find(
        (e) => e.memberId.toLowerCase() === memberId.toLowerCase(),
      )?.memberId ?? memberId;
    rows.push({
      rowNumber,
      memberId: canonical,
      attendance,
      note: note || null,
    });
  });

  return { rows, errors };
}
