import { useMutation } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";
import type { UpdateProfileRequest } from "@/services/profile.service";

export function useUpdateProfile() {
  return useMutation({
    mutationFn: (payload: UpdateProfileRequest) =>
      profileService.updateProfile(payload),
  });
}
