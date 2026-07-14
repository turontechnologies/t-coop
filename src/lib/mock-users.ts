import type { AuthenticatedMember } from "@/types/auth";

// Hardcoded demo accounts — no backend is wired up yet. One login per role
// so the platform can be demoed end-to-end. Remove once real auth lands.
interface MockUser {
  membershipId: string;
  password: string;
  member: AuthenticatedMember;
}

export const MOCK_USERS: MockUser[] = [
  {
    membershipId: "SA-0001",
    password: "SuperAdmin@2026",
    member: {
      id: "SA-0001",
      name: "Falola Mayowa",
      email: "mayor@gmail.com",
      role: "super_admin",
    },
  },
  {
    membershipId: "AD-0001",
    password: "Admin@2026",
    member: {
      id: "AD-0001",
      name: "Chidinma Eze",
      email: "chidinma.eze@t-coop.com",
      role: "admin",
    },
  },
  {
    membershipId: "MB-0001",
    password: "Member@2026",
    member: {
      id: "MB-0001",
      name: "Tunde Bakare",
      email: "tunde.bakare@t-coop.com",
      role: "member",
    },
  },
];
