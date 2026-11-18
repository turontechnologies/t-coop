import type { ImportRowError, ParsedImportResult } from "@/lib/table-import";
import type { CoopMemberRole } from "@/lib/coop-data";
import {
  cell,
  downloadTemplate,
  readFilledRows,
  text,
} from "@/lib/import-template";

const VALID_ROLES: CoopMemberRole[] = ["Member", "Admin"];
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export interface ImportedMemberRow {
  rowNumber: number;
  membershipId: string;
  alternativeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  role: CoopMemberRole;
  country: string;
  state: string;
}

/** `alternativeIdLabel`: what the co-op calls the alternative ID. */
export function downloadMemberImportTemplate(
  alternativeIdLabel = "Alternative ID",
) {
  downloadTemplate({
    filename: "members-template.xlsx",
    title: "Adding many members at once",
    steps: [
      "Write one member on each row.",
      "Delete the example row before you upload.",
      "Every new member gets an email with their Membership ID and password so they can log in.",
      "Each Membership ID, email address and " +
        alternativeIdLabel +
        " must be different. No two people can share one.",
      "You will see every row before anything is saved.",
    ],
    columns: [
      {
        name: "Membership ID",
        required: "Yes",
        help: "A new ID for this member, e.g. MB-0101. No one else can have it.",
        width: 16,
      },
      {
        name: alternativeIdLabel,
        required: "No",
        help: `Another ID the member already has, e.g. a staff number. They can log in with it too, so no one else can have the same one.`,
        width: Math.max(16, alternativeIdLabel.length + 4),
      },
      {
        name: "First Name",
        required: "Yes",
        help: "The member's first name.",
        width: 14,
      },
      {
        name: "Last Name",
        required: "Yes",
        help: "The member's surname.",
        width: 14,
      },
      {
        name: "Email Address",
        required: "Yes",
        help: "Their email. Their login details are sent here. No one else can have it.",
        width: 28,
      },
      {
        name: "Phone",
        required: "Yes",
        help: "Their phone number, e.g. 08012345678.",
        width: 16,
      },
      {
        name: "Role",
        required: "No",
        help: 'Type "Member" or "Admin". Empty means Member.',
        width: 10,
      },
      { name: "Country", required: "Yes", help: "e.g. Nigeria.", width: 12 },
      { name: "State", required: "No", help: "e.g. Lagos.", width: 12 },
    ],
    rows: [
      [
        "MB-0101",
        "",
        "Ada",
        "Okafor",
        "ada.okafor@example.com",
        "08012345678",
        "Member",
        "Nigeria",
        "Lagos",
      ],
    ],
  });
}

export async function parseMemberImportFile(
  file: File,
  existing: { id: string; email?: string; alternativeId?: string | null }[],
  alternativeIdLabel = "Alternative ID",
): Promise<ParsedImportResult<ImportedMemberRow>> {
  const raws = await readFilledRows(file);
  if (!raws)
    return { rows: [], errors: [{ row: 1, message: "The file is empty" }] };

  const rows: ImportedMemberRow[] = [];
  const errors: ImportRowError[] = [];
  const takenIds = new Set(existing.map((m) => m.id.toLowerCase()));
  const takenEmails = new Set(
    existing.map((m) => (m.email ?? "").toLowerCase()).filter(Boolean),
  );
  const takenAltIds = new Set(
    existing.map((m) => (m.alternativeId ?? "").toLowerCase()).filter(Boolean),
  );

  raws.forEach((raw, index) => {
    const rowNumber = index + 2;
    const fail = (message: string) => errors.push({ row: rowNumber, message });
    const membershipId = text(cell(raw, "Membership ID"));
    const firstName = text(cell(raw, "First Name"));
    if (!membershipId && !firstName) return; // empty row

    if (!membershipId) return void fail("Type a Membership ID");
    if (takenIds.has(membershipId.toLowerCase()))
      return void fail(`The Membership ID "${membershipId}" is already taken`);

    const alternativeId = text(cell(raw, alternativeIdLabel, "Alternative ID"));
    if (alternativeId) {
      if (takenAltIds.has(alternativeId.toLowerCase()))
        return void fail(
          `The ${alternativeIdLabel} "${alternativeId}" is already taken. Each one must be different.`,
        );
      if (
        takenIds.has(alternativeId.toLowerCase()) ||
        alternativeId.toLowerCase() === membershipId.toLowerCase()
      )
        return void fail(
          `The ${alternativeIdLabel} "${alternativeId}" is the same as a Membership ID. Use a different one.`,
        );
    }

    if (!firstName) return void fail("Type the First Name");
    const lastName = text(cell(raw, "Last Name", "Surname"));
    if (!lastName) return void fail("Type the Last Name");

    const email = text(cell(raw, "Email Address", "Email"));
    if (!email || !EMAIL_PATTERN.test(email))
      return void fail("Type a correct email address, e.g. name@example.com");
    if (takenEmails.has(email.toLowerCase()))
      return void fail(`The email "${email}" is already used by someone else`);

    const phone = text(cell(raw, "Phone", "Phone Number"));
    if (!phone) return void fail("Type the Phone number");

    const roleRaw = text(cell(raw, "Role"));
    const role = VALID_ROLES.find(
      (r) => r.toLowerCase() === roleRaw.toLowerCase(),
    );
    if (roleRaw && !role)
      return void fail('The Role must be "Member" or "Admin"');

    const country = text(cell(raw, "Country"));
    if (!country) return void fail("Type the Country");

    takenIds.add(membershipId.toLowerCase());
    takenEmails.add(email.toLowerCase());
    if (alternativeId) takenAltIds.add(alternativeId.toLowerCase());
    rows.push({
      rowNumber,
      membershipId,
      alternativeId,
      firstName,
      lastName,
      email,
      phone,
      role: role ?? "Member",
      country,
      state: text(cell(raw, "State")),
    });
  });

  return { rows, errors };
}
