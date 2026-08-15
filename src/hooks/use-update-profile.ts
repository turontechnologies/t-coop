import { useMutation, useQueryClient } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import type { UpdateProfileRequest } from "@/services/profile.service";
import { useAuthStore } from "@/store/auth.store";

export function useUpdateProfile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) =>
      profileService.updateProfile(payload),
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
