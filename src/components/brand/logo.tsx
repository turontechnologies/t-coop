import Image from "next/image";
import { cn } from "@/lib/utils";

interface LogoProps {
  className?: string;
  priority?: boolean;
}

/**
 * Full wordmark lockup. The source asset is authored in white, so this
 * component is intended for brand-green or other dark surfaces only — use
 * <LogoMark /> on light/neutral surfaces instead.
 */
export function Logo({ className, priority }: LogoProps) {
  return (
    <Image
      src="/logo-full.svg"
      alt="T-Coop"
      width={178}
      height={48}
      priority={priority}
      className={cn("h-8 w-auto", className)}
    />
  );
}
