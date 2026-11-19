import type {
  Application,
  ApplicationDetails,
} from "@/services/membership.service";

/** The applicant's private key for their application, kept in this browser so they can come back. */
export interface JoinSession {
  applicationId: string;
  token: string;
}

const keyFor = (coopId: string) => `tcoop-join:${coopId.toLowerCase()}`;

export function loadJoinSession(coopId: string): JoinSession | null {
  try {
    const raw = window.localStorage.getItem(keyFor(coopId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Partial<JoinSession>;
    return parsed.applicationId && parsed.token
      ? { applicationId: parsed.applicationId, token: parsed.token }
      : null;
  } catch {
    return null;
  }
}

export function saveJoinSession(coopId: string, session: JoinSession): void {
  try {
    window.localStorage.setItem(keyFor(coopId), JSON.stringify(session));
  } catch {
    // Private mode or storage blocked: they'll just confirm their email again next time.
  }
}

export function clearJoinSession(coopId: string): void {
  try {
    window.localStorage.removeItem(keyFor(coopId));
  } catch {
    // ignore
  }
}

/** The form's editable copy of what's saved. */
export function detailsFrom(app: Application): ApplicationDetails {
  return {
    firstName: app.firstName ?? "",
    lastName: app.lastName ?? "",
    otherName: app.otherName ?? "",
    gender: app.gender ?? "",
    dateOfBirth: app.dateOfBirth ?? "",
    phone: app.phone ?? "",
    nin: app.nin ?? "",
    occupation: app.occupation ?? "",
    homeAddress: app.homeAddress ?? "",
    country: app.country ?? "Nigeria",
    state: app.state ?? "",
    city: app.city ?? "",
    nextOfKinName: app.nextOfKinName ?? "",
    nextOfKinPhone: app.nextOfKinPhone ?? "",
    nextOfKinRelationship: app.nextOfKinRelationship ?? "",
    bankCode: app.bankCode ?? "",
    accountNumber: app.accountNumber ?? "",
    accountName: app.accountName ?? "",
    idDocumentType: app.idDocumentType ?? "",
    guarantors: null,
  };
}

export const ID_TYPES = [
  "National ID card or NIN slip",
  "Voter's card",
  "Driver's licence",
  "International passport",
];

export const RELATIONSHIPS = [
  "Husband or wife",
  "Father or mother",
  "Brother or sister",
  "Son or daughter",
  "Other family member",
  "Friend",
];

const PHONE = /^\+?[0-9][0-9 ()-]{6,19}$/;

export const isPhone = (value: string) => PHONE.test(value.trim());

/** Years between a yyyy-mm-dd date and today. */
export function ageFrom(dateOfBirth: string): number | null {
  if (!dateOfBirth) return null;
  const born = new Date(`${dateOfBirth}T00:00:00`);
  if (Number.isNaN(born.getTime())) return null;
  const now = new Date();
  let age = now.getFullYear() - born.getFullYear();
  const beforeBirthday =
    now.getMonth() < born.getMonth() ||
    (now.getMonth() === born.getMonth() && now.getDate() < born.getDate());
  if (beforeBirthday) age -= 1;
  return age;
}
