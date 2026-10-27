import { useQuery } from "@tanstack/react-query";
import { profileService } from "@/services/profile.service";

/** `memberId` only keys the cache — the backend always returns the signed-in member's profile. */
export function useProfile(memberId: string | undefined) {
  return useQuery({
    queryKey: ["profile", memberId],
    queryFn: () => profileService.getProfile(),
    enabled: Boolean(memberId),
    staleTime: 60_000,
  });
}
