import type { ReactNode } from "react";
import Link from "next/link";
import { Logo } from "@/components/brand/logo";
import { ThemeToggle } from "@/components/theme/theme-toggle";

/** The public pages for people applying to join a co-operative — no login needed. */
export default function JoinLayout({ children }: { children: ReactNode }) {
  return (
    <div className="relative min-h-dvh bg-background">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-72 bg-[radial-gradient(60%_100%_at_50%_0%,color-mix(in_oklch,var(--primary)_14%,transparent),transparent)]"
        aria-hidden="true"
      />
      <header className="relative mx-auto flex max-w-4xl items-center justify-between gap-3 px-4 py-4 sm:px-6">
        <Link
          href="/join"
          className="rounded-xl bg-sidebar px-3 py-2 shadow-card"
          aria-label="Join a co-operative"
        >
          <Logo className="h-6 w-auto" />
        </Link>
        <div className="flex items-center gap-2">
          <Link
            href="/join/status"
            className="hidden rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:text-foreground sm:inline"
          >
            Check my application
          </Link>
          <Link
            href="/login"
            className="rounded-lg px-3 py-2 text-sm font-medium text-primary hover:underline dark:text-emerald-300"
          >
            Log in
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="relative mx-auto max-w-4xl px-4 pb-16 sm:px-6">
        {children}
      </main>
    </div>
  );
}
