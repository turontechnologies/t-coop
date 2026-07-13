import { useMutation } from "@tanstack/react-query";
import { authService } from "@/services/auth.service";
import type { LoginRequest } from "@/types/auth";

export function useLogin() {
  return useMutation({
    mutationFn: (payload: LoginRequest) => authService.login(payload),
  });
}
