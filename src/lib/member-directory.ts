import {
  findCoopMember,
  findCooperative,
  type CoopMember,
  type Cooperative,
} from "@/lib/coop-data";

/**
 * The admin role's "Members Directory" is the member list of the one
 * co-operative an admin manages — reusing the same Cooperative/CoopMember
 * data model the super admin's `/co-operatives` oversight area uses,
 * rather than a second parallel dataset. Centralized here so which co-op
 * that is stays a one-line decision.
 */
export const ADMIN_DIRECTORY_COOP_ID = "COOP-0001";

export function getDirectoryCoop(
  cooperatives: Cooperative[],
): Cooperative | undefined {
  return findCooperative(cooperatives, ADMIN_DIRECTORY_COOP_ID);
}

export function getDirectoryMembers(cooperatives: Cooperative[]): CoopMember[] {
  return getDirectoryCoop(cooperatives)?.members ?? [];
}

export function findDirectoryMember(
  cooperatives: Cooperative[],
  memberId: string,
): CoopMember | undefined {
  return findCoopMember(getDirectoryCoop(cooperatives), memberId);
}
