import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { PasswordResetRequest } from "@/types/auth";

export function useForgotPassword() {
  return useMutation({
    mutationFn: (payload: PasswordResetRequest) =>
      authService.requestPasswordReset(payload),
  });
}
