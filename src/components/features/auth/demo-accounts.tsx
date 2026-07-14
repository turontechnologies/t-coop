"use client";

import { motion } from "framer-motion";
import { ShieldCheck, UserCog, UserRound } from "lucide-react";
import { MOCK_USERS } from "@/lib/mock-users";

const ROLE_META = {
  super_admin: { label: "Super Administrator", icon: ShieldCheck },
  admin: { label: "Administrator", icon: UserCog },
  member: { label: "Member", icon: UserRound },
} as const;

interface DemoAccountsProps {
  onSelect: (membershipId: string, password: string) => void;
}

export function DemoAccounts({ onSelect }: DemoAccountsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.4, duration: 0.4, ease: "easeOut" }}
      className="space-y-2 rounded-xl border border-border bg-muted/40 p-3"
    >
      <p className="text-xs font-medium text-muted-foreground">
        Demo accounts — click to autofill
      </p>
      <div className="grid gap-1.5">
        {MOCK_USERS.map((user) => {
          const meta = ROLE_META[user.member.role];
          const Icon = meta.icon;
          return (
            <button
              key={user.membershipId}
              type="button"
              onClick={() => onSelect(user.membershipId, user.password)}
              className="flex items-center gap-2.5 rounded-lg border border-transparent bg-card px-2.5 py-2 text-left text-sm ring-1 ring-border transition-colors hover:border-primary/30 hover:bg-accent focus-visible:border-primary/30 focus-visible:bg-accent focus-visible:outline-none"
            >
              <span className="flex size-7 shrink-0 items-center justify-center rounded-full bg-accent text-accent-foreground">
                <Icon className="size-3.5" aria-hidden="true" />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block truncate font-medium text-foreground">
                  {meta.label}
                </span>
                <span className="block truncate text-xs text-muted-foreground">
                  {user.membershipId}
                </span>
              </span>
            </button>
          );
        })}
      </div>
    </motion.div>
  );
}
