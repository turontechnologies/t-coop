import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { VerifyOtpRequest } from "@/types/auth";

export function useVerifyOtp() {
  return useMutation({
    mutationFn: (payload: VerifyOtpRequest) => authService.verifyOtp(payload),
  });
}
