import type { ProfileFormValues } from "@/lib/validations/profile.schema";

export interface ProfileRecord extends ProfileFormValues {
  membershipId: string;
}
