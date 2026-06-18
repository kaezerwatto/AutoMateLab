import { cn } from "@/lib/utils";

/**
 * Marque AutomateLab : un glyphe d'automate (deux états reliés par une
 * transition, l'état final en double cercle) dans un badge corail. Dessiné
 * en SVG pour rester net à toute taille et cohérent avec le thème.
 */
export function LogoMark({ size = 32, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      role="img"
      aria-label="AutomateLab"
      className={cn("shrink-0", className)}
    >
      <rect width="32" height="32" rx="8" fill="var(--color-primary)" />
      <g stroke="#ffffff" strokeWidth="1.7" strokeLinecap="round" fill="none">
        {/* transition courbe entre les deux états */}
        <path d="M11 13.5 C 14 10, 18 10, 21 13.5" />
        <path d="M20 11.6 L 21.3 13.7 L 18.9 14" fill="#ffffff" stroke="none" />
        {/* état initial */}
        <circle cx="9.5" cy="16.5" r="3.2" />
        {/* état final (double cercle) */}
        <circle cx="22.5" cy="16.5" r="3.2" />
        <circle cx="22.5" cy="16.5" r="1.4" />
      </g>
    </svg>
  );
}

export function LogoFull({ collapsed = false, className }: { collapsed?: boolean; className?: string }) {
  return (
    <div className={cn("flex items-center gap-2.5", className)}>
      <LogoMark size={32} />
      {!collapsed && (
        <div className="leading-tight">
          <p className="text-[15px] font-semibold tracking-tight text-[var(--color-text)]">
            AutomateLab
          </p>
          <p className="text-[11px] font-medium text-[var(--color-faint)]">INF3421 · Automates</p>
        </div>
      )}
    </div>
  );
}
