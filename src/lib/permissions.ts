import {
  COOP_PERMISSION_MODULES,
  PERMISSION_MODULES,
} from "@/lib/settings-data";

export type AccessLevel = "read" | "write";

export interface MenuNode {
  label: string;
  /** Sub-items within this module a role can be granted independently of (or in addition to)
   * the module as a whole — e.g. Savings & Contributions' "Members Savings" vs "My Savings" vs
   * "Request" tabs. Omitted (or empty) for modules with nothing to grant below the top level. */
  tabs?: string[];
}

/** What a CoopRole (admin's own Settings -> User Management -> Roles) can grant — every
 * COOP_PERMISSION_MODULES entry, with tabs filled in for the modules that actually have more
 * than one on the page they gate. */
export const COOP_MENU_TREE: MenuNode[] = COOP_PERMISSION_MODULES.map(
  (label) => {
    if (label === "Savings & Contributions") {
      return { label, tabs: ["Members Savings", "My Savings", "Request"] };
    }
    if (label === "Loans") {
      return { label, tabs: ["Requests", "Members Loans", "My Loans"] };
    }
    if (label === "Settings") {
      return {
        label,
        tabs: [
          "Profile",
          "Savings Settings",
          "Loan Settings",
          "Co-operative Settings",
          "User Management",
        ],
      };
    }
    return { label };
  },
);

/** What a PlatformRole (super admin's own Settings -> User Management -> Roles) can grant.
 * Flat today — every page a platform-staff member reaches has at most one tab (Total Savings /
 * Total Loans on their own Savings & Contributions / Loans oversight views), so there's nothing
 * below module level to expose yet. Kept as its own export (rather than reusing COOP_MENU_TREE)
 * so a future tabbed platform-staff page only needs a change here, not at every call site. */
export const PLATFORM_MENU_TREE: MenuNode[] = PERMISSION_MODULES.map(
  (label) => ({ label }),
);

interface Grant {
  module: string;
  tab: string | null;
  access: AccessLevel;
}

/** Encoding for one stored permission string:
 *   "<module>"                    — legacy (pre-dates read/write); treated as module-level write
 *   "<module>::<access>"          — whole module, explicit access level
 *   "<module>::<tab>::<access>"   — just that one tab within the module
 * `::` can't collide with a real module/tab label — none of them contain a colon. */
function parseGrant(raw: string): Grant {
  const parts = raw.split("::");
  if (parts.length === 1)
    return { module: parts[0], tab: null, access: "write" };
  if (parts.length === 2) {
    return { module: parts[0], tab: null, access: parts[1] as AccessLevel };
  }
  return { module: parts[0], tab: parts[1], access: parts[2] as AccessLevel };
}

export function serializeModuleGrant(
  module: string,
  access: AccessLevel,
): string {
  return `${module}::${access}`;
}

export function serializeTabGrant(
  module: string,
  tab: string,
  access: AccessLevel,
): string {
  return `${module}::${tab}::${access}`;
}

/** Every distinct module touched by a set of grants, whether granted at module level or only
 * through one of its tabs — for "how many modules does this role reach" summaries. */
export function grantedModules(grants: string[]): string[] {
  return Array.from(new Set(grants.map((raw) => parseGrant(raw).module)));
}

/** A short, human-readable summary of one role's permission grants for a roles-list table —
 * "All access", "Savings & Contributions" (a single whole module), "Loans → Request" (a single
 * tab-only grant), or "N modules". */
export function describeGrants(grants: string[], fullTree: MenuNode[]): string {
  const modules = grantedModules(grants);
  if (modules.length === 0) return "No access";
  if (modules.length >= fullTree.length) return "All access";
  if (modules.length === 1 && grants.length === 1) {
    const grant = parseGrant(grants[0]);
    return grant.tab ? `${grant.module} → ${grant.tab}` : grant.module;
  }
  return `${modules.length} module${modules.length === 1 ? "" : "s"}`;
}

/** `null` grants (the caller's role isn't permission-restricted at all — a real admin/super
 * admin, not a CoopRole/PlatformRole holder) means unrestricted: full write access to
 * everything, matching `dashboard-nav.ts`'s existing "null permissionModules = unrestricted"
 * convention. */
export function moduleAccess(
  grants: string[] | null | undefined,
  module: string,
): AccessLevel | null {
  if (grants == null) return "write";
  let best: AccessLevel | null = null;
  for (const raw of grants) {
    const grant = parseGrant(raw);
    if (grant.module !== module || grant.tab !== null) continue;
    if (grant.access === "write") return "write";
    best = "read";
  }
  return best;
}

/** Whether this role can reach the module's page at all — a module-level grant, OR a grant on
 * any one of its tabs (a tab-only grant with no module-level entry still needs the nav item
 * visible and the route reachable, just narrower once they're on the page — see `tabAccess` for
 * what's actually visible there). Use this for nav-item visibility / route gating; use
 * `moduleAccess` only where you specifically mean "the whole module, not just some tab of it." */
export function hasModuleAccess(
  grants: string[] | null | undefined,
  module: string,
): boolean {
  if (grants == null) return true;
  return grants.some((raw) => parseGrant(raw).module === module);
}

/** A tab's access is at least whatever the whole module was granted, further raised by any
 * tab-specific grant — so "module: read, tab X: write" gives write on just X and read
 * everywhere else, and a module grant with no tab-specific entries applies uniformly. */
export function tabAccess(
  grants: string[] | null | undefined,
  module: string,
  tab: string,
): AccessLevel | null {
  if (grants == null) return "write";
  let best = moduleAccess(grants, module);
  for (const raw of grants) {
    const grant = parseGrant(raw);
    if (grant.module !== module || grant.tab !== tab) continue;
    if (grant.access === "write") return "write";
    if (best !== "write") best = "read";
  }
  return best;
}
