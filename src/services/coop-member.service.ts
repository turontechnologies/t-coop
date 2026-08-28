import { apiClient } from "@/lib/axios";
import type { CoopMember, CoopMemberRole } from "@/lib/coop-data";
import type { EditMemberFormValues } from "@/lib/validations/coop.schema";
import type { AddMemberFormValues } from "@/lib/validations/member-directory.schema";

interface CoopMemberDto {
  id: string;
  firstName: string;
  lastName: string;
  otherName: string | null;
  gender: string | null;
  email: string;
  phone: string | null;
  nin: string | null;
  homeAddress: string | null;
  role: "admin" | "member" | "super_admin";
  status: "Active" | "Inactive";
  guarantor: string | null;
  nextOfKinName: string | null;
  nextOfKinPhone: string | null;
  nextOfKinEmail: string | null;
  nextOfKinRelationship: string | null;
  nextOfKinAuthorityLevel: string | null;
  country: string | null;
  state: string | null;
  city: string | null;
  facebook: string | null;
  twitter: string | null;
  bankCode: string | null;
  accountNumber: string | null;
  accountName: string | null;
  avatarUrl: string | null;
}

function toRole(role: CoopMemberDto["role"]): CoopMemberRole {
  return role === "member" ? "Member" : "Admin";
}

function fromDto(dto: CoopMemberDto): CoopMember {
  return {
    id: dto.id,
    firstName: dto.firstName,
    lastName: dto.lastName,
    otherName: dto.otherName ?? "",
    gender: dto.gender ?? "",
    email: dto.email,
    phone: dto.phone ?? "",
    nin: dto.nin ?? "",
    homeAddress: dto.homeAddress ?? "",
    role: toRole(dto.role),
    status: dto.status,
    guarantor: dto.guarantor ?? "",
    nextOfKinName: dto.nextOfKinName ?? "",
    nextOfKinPhone: dto.nextOfKinPhone ?? "",
    nextOfKinEmail: dto.nextOfKinEmail ?? "",
    nextOfKinRelationship: dto.nextOfKinRelationship ?? "",
    nextOfKinAuthorityLevel: dto.nextOfKinAuthorityLevel ?? "",
    country: dto.country ?? "",
    state: dto.state ?? "",
    city: dto.city ?? "",
    facebook: dto.facebook ?? "",
    twitter: dto.twitter ?? "",
    bankCode: dto.bankCode ?? "",
    accountNumber: dto.accountNumber ?? "",
    accountName: dto.accountName ?? "",
    avatarUrl: dto.avatarUrl ?? "",
  };
}

/**
 * Real backend only (CooperativeController) — no mock fallback. Backs both the super-admin co-op
 * oversight Members tab AND the admin-facing Members Directory (`/members`); same data, just a
 * different `coopId` source (a path param for super admin, the signed-in admin's own id here).
 */
export const coopMemberService = {
  async getMembers(coopId: string): Promise<CoopMember[]> {
    const { data } = await apiClient.get<CoopMemberDto[]>(
      `/cooperatives/${coopId}/members`,
    );
    return data.map(fromDto);
  },

  async addMember(
    coopId: string,
    values: AddMemberFormValues,
  ): Promise<CoopMember> {
    // Each guarantor gets a real email invite server-side (MemberGuarantor) — the backend takes
    // the {name, email, phone} list as-is, not a joined string.
    const { data } = await apiClient.post<CoopMemberDto>(
      `/cooperatives/${coopId}/members`,
      values,
    );
    return fromDto(data);
  },

  async updateMember(
    coopId: string,
    memberId: string,
    values: EditMemberFormValues,
  ): Promise<CoopMember> {
    const { data } = await apiClient.patch<CoopMemberDto>(
      `/cooperatives/${coopId}/members/${memberId}`,
      { ...values, accountName: values.accountName ?? "" },
    );
    return fromDto(data);
  },

  async updateMemberStatus(
    coopId: string,
    memberId: string,
    status: "Active" | "Inactive",
  ): Promise<CoopMember> {
    const { data } = await apiClient.patch<CoopMemberDto>(
      `/cooperatives/${coopId}/members/${memberId}/status`,
      { status },
    );
    return fromDto(data);
  },
};
