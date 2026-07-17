"use client";

import { ProfileHeaderCard } from "@/components/features/profile/profile-header-card";
import { ProfileDetailsForm } from "@/components/features/profile/profile-details-form";
import { getProfileData } from "@/lib/profile-data";
import { useAuthStore } from "@/store/auth.store";

export default function ProfilePage() {
  const member = useAuthStore((state) => state.member);
  if (!member) return null;

  const profile = getProfileData(member.id);

  return (
    <div className="space-y-6 pt-6">
      <ProfileHeaderCard member={member} />
      <ProfileDetailsForm memberId={member.id} profile={profile} />
    </div>
  );
}
