import { cn } from "@/lib/utils";

interface LogoMarkProps {
  className?: string;
}

/**
 * Standalone diamond mark, recolored via currentColor so it adapts to any
 * surface (light cards, dark surfaces, favicons). Geometry mirrors the
 * nested-diamond motif from the primary T-Coop lockup (public/logo-full.svg).
 */
export function LogoMark({ className }: LogoMarkProps) {
  return (
    <svg
      viewBox="0 0 42 48"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={cn("text-primary", className)}
      role="img"
      aria-label="T-Coop"
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0465 42.0457L0.495117 21.0676L21.0595 0.496094L41.9122 21.2513L21.0465 42.0457Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeMiterlimit="2.61313"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.0989 44.6016L0.495117 24.0039L21.0465 3.07812L41.7026 23.794L21.0989 44.6016Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeMiterlimit="2.61313"
        opacity="0.7"
      />
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M21.152 47.082L0.600586 26.3925L21.152 5.4668L41.4981 26.5007L21.152 47.082Z"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeMiterlimit="2.61313"
        opacity="0.45"
      />
    </svg>
  );
}
