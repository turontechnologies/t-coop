import * as XLSX from "xlsx";
import { triggerDownload } from "@/lib/table-export";
import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import type { CoopMemberRole } from "@/lib/coop-data";

const TEMPLATE_HEADERS = [
  "Membership ID",
  "First Name",
  "Last Name",
  "Email Address",
  "Role",
  "Guarantor",
  "Country",
  "State",
];
const VALID_ROLES: CoopMemberRole[] = ["Member", "Admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ImportedMemberRow {
  membershipId: string;
  firstName: string;
  lastName: string;
  email: string;
  role: CoopMemberRole;
  guarantor: string;
  country: string;
  state: string;
}

export function downloadMemberImportTemplate() {
  const templateSheet = XLSX.utils.aoa_to_sheet([
    TEMPLATE_HEADERS,
    [
      "MEM-1001",
      "Ada",
      "Lovelace",
      "ada.lovelace@example.com",
      "Member",
      "Jonathan Newman",
      "Nigeria",
      "Lagos",
    ],
  ]);
  templateSheet["!cols"] = [
    { wch: 16 },
    { wch: 14 },
    { wch: 14 },
    { wch: 28 },
    { wch: 10 },
    { wch: 20 },
    { wch: 12 },
    { wch: 12 },
  ];

  const referenceSheet = XLSX.utils.aoa_to_sheet([
    ["Field", "Notes"],
    ["Membership ID", "Required, must be unique"],
    ["First Name", "Required"],
    ["Last Name", "Required"],
    ["Email Address", "Required, must be a valid email address"],
    [
      "Role",
      `Optional — defaults to "Member". Valid values: ${VALID_ROLES.join(", ")}`,
    ],
    ["Guarantor", "Optional"],
    ["Country", "Optional"],
    ["State", "Optional"],
  ]);
  referenceSheet["!cols"] = [{ wch: 18 }, { wch: 55 }];

  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, templateSheet, "Template");
  XLSX.utils.book_append_sheet(workbook, referenceSheet, "Field Reference");

  const buffer = XLSX.write(workbook, { type: "array", bookType: "xlsx" });
  triggerDownload(
    new Blob([buffer], { type: "application/octet-stream" }),
    "members-import-template.xlsx",
  );
}

export async function parseMemberImportFile(
  file: File,
  existingMemberIds: string[],
): Promise<ParsedImportResult<ImportedMemberRow>> {
  const buffer = await file.arrayBuffer();
  const workbook = XLSX.read(buffer, { type: "array" });
  const sheetName =
    workbook.SheetNames.find((name) => name.toLowerCase() === "template") ??
    workbook.SheetNames[0];
  const sheet = workbook.Sheets[sheetName];
  const rawRows = XLSX.utils.sheet_to_json<Record<string, unknown>>(sheet, {
    defval: "",
  });

  const rows: ImportedMemberRow[] = [];
  const errors: ImportRowError[] = [];
  const seenIds = new Set(existingMemberIds.map((id) => id.toLowerCase()));

  rawRows.forEach((raw, index) => {
    const rowNumber = index + 2; // header occupies row 1
    const membershipId = String(raw["Membership ID"] ?? "").trim();
    if (!membershipId) return; // skip fully blank rows

    if (seenIds.has(membershipId.toLowerCase())) {
      errors.push({
        row: rowNumber,
        message: `Membership ID "${membershipId}" is already in use`,
      });
      return;
    }

    const firstName = String(raw["First Name"] ?? "").trim();
    if (!firstName) {
      errors.push({ row: rowNumber, message: "First Name is required" });
      return;
    }

    const lastName = String(raw["Last Name"] ?? "").trim();
    if (!lastName) {
      errors.push({ row: rowNumber, message: "Last Name is required" });
      return;
    }

    const email = String(raw["Email Address"] ?? raw["Email"] ?? "").trim();
    if (!email || !EMAIL_PATTERN.test(email)) {
      errors.push({
        row: rowNumber,
        message: "A valid Email Address is required",
      });
      return;
    }

    const roleRaw = String(raw["Role"] ?? "").trim();
    const matchedRole = VALID_ROLES.find(
      (role) => role.toLowerCase() === roleRaw.toLowerCase(),
    );
    if (roleRaw && !matchedRole) {
      errors.push({
        row: rowNumber,
        message: `Role must be one of: ${VALID_ROLES.join(", ")}`,
      });
      return;
    }

    seenIds.add(membershipId.toLowerCase());
    rows.push({
      membershipId,
      firstName,
      lastName,
      email,
      role: matchedRole ?? "Member",
      guarantor: String(raw["Guarantor"] ?? "").trim(),
      country: String(raw["Country"] ?? "").trim(),
      state: String(raw["State"] ?? "").trim(),
    });
  });

  return { rows, errors };
}
