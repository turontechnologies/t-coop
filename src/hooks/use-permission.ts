import { moduleAccess, tabAccess, type AccessLevel } from "@/lib/permissions";
import { useAuthStore } from "@/store/auth.store";

/** `null` when the signed-in member's role (CoopRole/PlatformRole holder) wasn't granted this
 * module at all — hide the corresponding nav item, tab, or page. `"read"`/`"write"` for everyone
 * else, including every unrestricted role (a real admin/super admin/member always gets `"write"`
 * — see `moduleAccess`'s own doc for why `null` grants means unrestricted). */
export function useModuleAccess(module: string): AccessLevel | null {
  const permissionModules = useAuthStore(
    (state) => state.member?.permissionModules,
  );
  return moduleAccess(permissionModules, module);
}

export function useTabAccess(module: string, tab: string): AccessLevel | null {
  const permissionModules = useAuthStore(
    (state) => state.member?.permissionModules,
  );
  return tabAccess(permissionModules, module, tab);
}
