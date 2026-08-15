import { useMutation } from "@tanstack/react-query";
import { changePasswordService } from "@/services/change-password.service";
import type { ChangePasswordRequest } from "@/services/change-password.service";

export function useChangePassword() {
  return useMutation({
    mutationFn: (payload: ChangePasswordRequest) =>
      changePasswordService.changePassword(payload),
  });
}
