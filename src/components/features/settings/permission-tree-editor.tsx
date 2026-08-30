"use client";

import { useState } from "react";
import { ChevronDown, ChevronRight } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import {
  moduleAccess,
  serializeModuleGrant,
  serializeTabGrant,
  tabAccess,
  type AccessLevel,
  type MenuNode,
} from "@/lib/permissions";
import { cn } from "@/lib/utils";

interface PermissionTreeEditorProps {
  tree: MenuNode[];
  value: string[];
  onChange: (next: string[]) => void;
  disabled?: boolean;
}

/** A module checkbox grants the whole module (every tab beneath it); a tab checkbox grants just
 * that one tab on its own, independent of whether the module itself is granted — so an admin can
 * either hand over a whole area, or open just one narrow slice of it (e.g. only the "Request"
 * tab of Savings & Contributions, nothing else in that module). */
export function PermissionTreeEditor({
  tree,
  value,
  onChange,
  disabled,
}: PermissionTreeEditorProps) {
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const toggleExpand = (label: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(label)) next.delete(label);
      else next.add(label);
      return next;
    });
  };

  const setModuleGrant = (module: string, access: AccessLevel | null) => {
    const withoutModuleGrant = value.filter((raw) => {
      const isModuleLevel =
        raw === module ||
        raw === `${module}::read` ||
        raw === `${module}::write`;
      return !isModuleLevel;
    });
    onChange(
      access
        ? [...withoutModuleGrant, serializeModuleGrant(module, access)]
        : withoutModuleGrant,
    );
  };

  const setTabGrant = (
    module: string,
    tab: string,
    access: AccessLevel | null,
  ) => {
    const withoutTabGrant = value.filter(
      (raw) =>
        raw !== serializeTabGrant(module, tab, "read") &&
        raw !== serializeTabGrant(module, tab, "write"),
    );
    onChange(
      access
        ? [...withoutTabGrant, serializeTabGrant(module, tab, access)]
        : withoutTabGrant,
    );
  };

  return (
    <div className="max-h-72 space-y-0.5 overflow-y-auto rounded-lg border border-input p-2">
      {tree.map((node) => {
        const access = moduleAccess(value, node.label);
        const hasTabs = (node.tabs?.length ?? 0) > 0;
        const isExpanded = expanded.has(node.label);
        return (
          <div key={node.label}>
            <div className="flex items-center gap-2 rounded-md px-2 py-1.5 hover:bg-accent/60">
              {hasTabs ? (
                <button
                  type="button"
                  onClick={() => toggleExpand(node.label)}
                  className="text-muted-foreground"
                  aria-label={isExpanded ? "Collapse" : "Expand"}
                >
                  {isExpanded ? (
                    <ChevronDown className="size-3.5" aria-hidden="true" />
                  ) : (
                    <ChevronRight className="size-3.5" aria-hidden="true" />
                  )}
                </button>
              ) : (
                <span className="size-3.5 shrink-0" />
              )}
              <Checkbox
                checked={access !== null}
                disabled={disabled}
                onCheckedChange={(checked) =>
                  setModuleGrant(node.label, checked === true ? "write" : null)
                }
              />
              <span className="flex-1 text-sm text-foreground">
                {node.label}
              </span>
              {access !== null ? (
                <AccessToggle
                  value={access}
                  disabled={disabled}
                  onChange={(next) => setModuleGrant(node.label, next)}
                />
              ) : null}
            </div>

            {hasTabs && isExpanded ? (
              <div className="mb-1 ml-8 space-y-0.5 border-l border-border pl-3">
                {node.tabs?.map((tab) => {
                  const tabLevelAccess = tabAccess(value, node.label, tab);
                  return (
                    <div key={tab} className="flex items-center gap-2 py-1">
                      <Checkbox
                        checked={tabLevelAccess !== null}
                        disabled={disabled}
                        onCheckedChange={(checked) =>
                          setTabGrant(
                            node.label,
                            tab,
                            checked === true ? "write" : null,
                          )
                        }
                      />
                      <span className="flex-1 text-xs text-muted-foreground">
                        {tab}
                      </span>
                      {tabLevelAccess !== null ? (
                        <AccessToggle
                          value={tabLevelAccess}
                          disabled={disabled}
                          onChange={(next) =>
                            setTabGrant(node.label, tab, next)
                          }
                        />
                      ) : null}
                    </div>
                  );
                })}
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}

function AccessToggle({
  value,
  disabled,
  onChange,
}: {
  value: AccessLevel;
  disabled?: boolean;
  onChange: (value: AccessLevel) => void;
}) {
  return (
    <div className="flex items-center rounded-md border border-border p-0.5 text-xs">
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("read")}
        className={cn(
          "rounded px-2 py-0.5 transition-colors",
          value === "read"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Read
      </button>
      <button
        type="button"
        disabled={disabled}
        onClick={() => onChange("write")}
        className={cn(
          "rounded px-2 py-0.5 transition-colors",
          value === "write"
            ? "bg-primary text-primary-foreground"
            : "text-muted-foreground hover:text-foreground",
        )}
      >
        Write
      </button>
    </div>
  );
}
