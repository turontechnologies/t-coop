import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { ResetPasswordRequest } from "@/types/auth";

export function useResetPassword() {
  return useMutation({
    mutationFn: (payload: ResetPasswordRequest) =>
      authService.resetPassword(payload),
  });
}
