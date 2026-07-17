import type { ProfileFormValues } from "@/lib/validations/profile.schema";

export interface ProfileRecord extends ProfileFormValues {
  membershipId: string;
}

const PROFILES: Record<string, ProfileRecord> = {
  "SA-0001": {
    membershipId: "SA-0001",
    bvn: "22134455667",
    firstName: "Falola",
    lastName: "Mayowa",
    otherName: "",
    gender: "Male",
    phone: "08023456789",
    email: "mayor@gmail.com",
    homeAddress: "14 Admiralty Way, Lekki Phase 1",
    country: "Nigeria",
    state: "Lagos",
    facebook: "",
    twitter: "",
    guarantor: "Board of Trustees",
  },
  "AD-0001": {
    membershipId: "AD-0001",
    bvn: "22198765432",
    firstName: "Chidinma",
    lastName: "Eze",
    otherName: "Ngozi",
    gender: "Female",
    phone: "08134567890",
    email: "chidinma.eze@t-coop.com",
    homeAddress: "22 Aba Road, GRA Phase 2",
    country: "Nigeria",
    state: "Rivers",
    facebook: "",
    twitter: "",
    guarantor: "Falola Mayowa",
  },
  "MB-0001": {
    membershipId: "MB-0001",
    bvn: "10298283639",
    firstName: "Tunde",
    lastName: "Bakare",
    otherName: "Jonathan",
    gender: "Male",
    phone: "09029927823",
    email: "adedarasapok@gmail.com",
    homeAddress: "10 Jones Street, Yaba",
    country: "Nigeria",
    state: "Lagos",
    facebook: "",
    twitter: "",
    guarantor: "Kolawole Ojo",
  },
};

const FALLBACK: Omit<ProfileRecord, "membershipId"> = {
  bvn: "00000000000",
  firstName: "",
  lastName: "",
  otherName: "",
  gender: "Other",
  phone: "",
  email: "",
  homeAddress: "",
  country: "Nigeria",
  state: "",
  facebook: "",
  twitter: "",
  guarantor: "",
};

export function getProfileData(memberId: string): ProfileRecord {
  return PROFILES[memberId] ?? { ...FALLBACK, membershipId: memberId };
}

export function updateProfileData(
  memberId: string,
  values: Partial<ProfileRecord>,
): void {
  const current = PROFILES[memberId] ?? { ...FALLBACK, membershipId: memberId };
  PROFILES[memberId] = { ...current, ...values };
}
