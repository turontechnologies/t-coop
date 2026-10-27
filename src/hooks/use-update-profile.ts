import { useMutation, useQueryClient } from "@tanstack/react-query";
import type { ProfileFormValues } from "@/lib/validations/profile.schema";
import { profileService } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

interface UpdateProfileRequest {
  /** Keys the cache to invalidate — the backend always updates the signed-in member. */
  memberId: string;
  values: ProfileFormValues;
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ values }: UpdateProfileRequest) =>
      profileService.updateProfile(values),
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ["profile", variables.memberId],
      });

      // The topbar/header reads name+email from the auth store, not the
      // profile query — without this, a name/email change only shows up
      // there after a full reload (a real, reported bug: the header kept
      // showing stale info right after a successful save).
      const currentMember = useAuthStore.getState().member;
      if (currentMember && currentMember.id === variables.memberId) {
        useAuthStore.getState().setMember({
          ...currentMember,
          name: `${data.firstName} ${data.lastName}`.trim(),
          email: data.email,
        });
      }
    },
  });
}
