import type { ReactNode } from "react";
import { ArrowUpRight, Copyright } from "lucide-react";
import { Logo } from "@/components/brand/logo";

interface CenteredAuthLayoutProps {
  children: ReactNode;
}

export function CenteredAuthLayout({ children }: CenteredAuthLayoutProps) {
  return (
    <div className="flex min-h-dvh flex-col bg-[linear-gradient(160deg,#00654A_0%,#00543D_45%,#003224_100%)]">
      <header className="px-6 py-6 sm:px-10">
        <Logo priority className="h-8 w-auto" />
      </header>

      <main className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-2xl bg-card p-8 shadow-2xl ring-1 ring-black/5 sm:p-10">
          {children}
        </div>
      </main>

      <footer className="flex items-center justify-center gap-6 pb-8 text-sm text-white/60">
        <span className="flex items-center gap-1">
          <Copyright className="size-3.5" aria-hidden="true" />
          Turon
        </span>
        <a
          href="mailto:hello@turon.tech"
          className="flex items-center gap-1 hover:text-white"
        >
          Contact
          <ArrowUpRight className="size-3.5" aria-hidden="true" />
        </a>
      </footer>
    </div>
  );
}
