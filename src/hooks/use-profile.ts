import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";

export function useProfile(memberId: string | undefined) {
  return useQuery({
    queryKey: ["profile", memberId],
    queryFn: () => profileService.getProfile(memberId as string),
    enabled: Boolean(memberId),
    staleTime: 60_000,
  });
}
