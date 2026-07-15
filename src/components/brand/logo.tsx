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
      src="https://res.cloudinary.com/djstai84f/image/upload/v1784102518/Logo_1_kspxky.png"
      alt="T-Coop"
      width={179}
      height={42}
      priority={priority}
      className={cn("h-8 w-auto", className)}
    />
  );
}
