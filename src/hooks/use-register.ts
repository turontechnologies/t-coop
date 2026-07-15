import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { RegisterCooperativeRequest } from "@/types/auth";

export function useRegister() {
  return useMutation({
    mutationFn: (payload: RegisterCooperativeRequest) =>
      authService.registerCooperative(payload),
  });
}
