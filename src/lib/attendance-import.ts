import * as XLSX from "xlsx";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import { responseLabel } from "@/lib/meeting";
import {
  alternativeIdColumn,
  cell,
  downloadTemplate,
  FILL_SHEET,
  memberLookup,
  type MemberLookup,
} from "@/lib/import-template";
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

export function downloadAttendanceTemplate(
  register: MeetingRegister,
  lookup: MemberLookup = memberLookup([]),
) {
  const safeTitle = register.title
    .replace(/[^\w-]+/g, "-")
    .toLowerCase()
    .slice(0, 40);
  downloadTemplate({
    filename: `attendance-${safeTitle}-${register.meetingDate ?? "template"}.xlsx`,
    title: `Attendance for "${register.title}"${register.meetingDate ? ` on ${register.meetingDate}` : ""}`,
    steps: [
      "Everyone invited to this meeting is already listed for you.",
      'In the Attendance column, type "In person", "Online" or "Absent" for each person.',
      "Leave Attendance empty if you don't want to change that person.",
      "You can upload this before, during or after the meeting.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes",
        help: "Already filled in. Don't change it.",
        width: 16,
      },
      {
        ...alternativeIdColumn(lookup),
        required: "No",
        help: "Already filled in where the member has one. Just for your information.",
      },
      {
        name: "Member",
        required: "No",
        help: "The member's name. Just for your information.",
        width: 28,
      },
      {
        name: "Said beforehand",
        required: "No",
        help: "What they said before the meeting. Just for your information.",
        width: 20,
      },
      {
        name: "Attendance",
        required: "Yes",
        help: 'Type "In person", "Online" or "Absent".',
        width: 14,
      },
      {
        name: "Note",
        required: "No",
        help: "Anything to add, e.g. why someone was absent.",
        width: 40,
      },
    ],
    rows: register.entries.map((entry) => [
      entry.memberId,
      lookup.alternativeIdOf.get(entry.memberId) ?? "",
      entry.memberName,
      responseLabel(entry.response),
      entry.attendance ? ATTENDANCE_LABELS[entry.attendance] : "",
      entry.attendanceNote ?? "",
    ]),
  });
}

export async function parseAttendanceFile(
  file: File,
  register: MeetingRegister,
  lookup: MemberLookup = memberLookup([]),
): Promise<ParsedImportResult<ImportedAttendanceRow>> {
  const workbook = XLSX.read(await file.arrayBuffer(), { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name === FILL_SHEET) ??
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
    const typedId = String(record["Membership ID"] ?? "").trim();
    const typedAlt = String(
      cell(record, lookup.label, "Alternative ID") ?? "",
    ).trim();
    const memberId =
      typedId ||
      (typedAlt
        ? (lookup.byAlternativeId.get(typedAlt.toLowerCase()) ?? typedAlt)
        : "");
    const attendanceRaw = String(record["Attendance"] ?? "");
    const note = String(record["Note"] ?? "").trim();
    if (!memberId && !attendanceRaw.trim()) return;

    if (!memberId) {
      errors.push({
        row: rowNumber,
        message: `Type the Membership ID or ${lookup.label}`,
      });
      return;
    }
    if (!invited.has(memberId.toLowerCase())) {
      errors.push({
        row: rowNumber,
        message: `${memberId} was not invited to this meeting`,
      });
      return;
    }
    // Check the value first, so a bad entry is reported as such, not as a duplicate.
    const attendance = toMark(attendanceRaw);
    if (attendance === undefined) {
      errors.push({
        row: rowNumber,
        message: `"${attendanceRaw.trim()}" is not right. Type In person, Online or Absent`,
      });
      return;
    }
    if (attendance === null) return; // blank: leave as is

    // Only rows that actually set attendance count towards duplicates.
    if (seen.has(memberId.toLowerCase())) {
      errors.push({
        row: rowNumber,
        message: `${memberId} is written more than once`,
      });
      return;
    }
    seen.add(memberId.toLowerCase());

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
