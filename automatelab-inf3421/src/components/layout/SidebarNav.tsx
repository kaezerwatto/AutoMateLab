"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Workflow,
  Regex,
  Sigma,
  Combine,
  FileText,
  CircleDot,
  PanelLeftClose,
  PanelLeftOpen,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { LogoFull } from "./Logo";

const SECTIONS = [
  {
    label: "Espace",
    items: [{ href: "/", label: "Tableau de bord", icon: LayoutDashboard }],
  },
  {
    label: "Éditeurs",
    items: [
      { href: "/lab", label: "Automate Studio", icon: CircleDot },
      { href: "/workflow", label: "Workflow Studio", icon: Workflow },
      { href: "/regex", label: "Regex Studio", icon: Regex },
    ],
  },
  {
    label: "Algèbre",
    items: [
      { href: "/equations", label: "Equation Studio", icon: Sigma },
      { href: "/closure", label: "Closure Studio", icon: Combine },
    ],
  },
  {
    label: "Sortie",
    items: [{ href: "/report", label: "Report Center", icon: FileText }],
  },
];

export function SidebarNav({
  onNavigate,
  collapsed = false,
  onToggle,
}: {
  onNavigate?: () => void;
  collapsed?: boolean;
  onToggle?: () => void;
}) {
  const pathname = usePathname();

  return (
    <nav className="flex h-full flex-col">
      {/* En-tête / marque */}
      <div
        className={cn(
          "flex items-center border-b border-[var(--color-border-soft)] px-3 py-3.5",
          collapsed ? "justify-center" : "justify-between",
        )}
      >
        <Link href="/" onClick={onNavigate} className="min-w-0">
          <LogoFull collapsed={collapsed} />
        </Link>
        {onToggle && !collapsed && (
          <button
            onClick={onToggle}
            className="hidden rounded-md p-1.5 text-[var(--color-faint)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] md:block"
            aria-label="Réduire la barre latérale"
          >
            <PanelLeftClose size={16} />
          </button>
        )}
      </div>

      {/* Navigation */}
      <div className="flex-1 overflow-y-auto px-2.5 py-3">
        {SECTIONS.map((section) => (
          <div key={section.label} className="mb-3">
            {!collapsed && (
              <div className="px-2 pb-1.5 text-[10px] font-semibold uppercase tracking-[0.08em] text-[var(--color-faint)]">
                {section.label}
              </div>
            )}
            <div className="flex flex-col gap-0.5">
              {section.items.map((item) => {
                const active =
                  item.href === "/"
                    ? pathname === "/"
                    : pathname.startsWith(item.href);
                const Icon = item.icon;
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    onClick={onNavigate}
                    title={collapsed ? item.label : undefined}
                    className={cn(
                      "group relative flex items-center gap-3 rounded-md px-2.5 py-2 text-sm font-medium transition-colors",
                      collapsed && "justify-center px-0",
                      active
                        ? "bg-[var(--color-surface-2)] text-[var(--color-text)]"
                        : "text-[var(--color-muted)] hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)]",
                    )}
                  >
                    {active && (
                      <span className="absolute left-0 top-1/2 h-5 w-[3px] -translate-y-1/2 rounded-r-full bg-[var(--color-primary)]" />
                    )}
                    <Icon
                      size={17}
                      className={cn(
                        "shrink-0 transition-colors",
                        active
                          ? "text-[var(--color-primary)]"
                          : "text-[var(--color-faint)] group-hover:text-[var(--color-text)]",
                      )}
                    />
                    {!collapsed && <span className="truncate">{item.label}</span>}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </div>

      {/* Pied */}
      <div className="border-t border-[var(--color-border-soft)] p-2.5">
        {collapsed ? (
          onToggle && (
            <button
              onClick={onToggle}
              className="hidden w-full items-center justify-center rounded-md p-2 text-[var(--color-faint)] transition-colors hover:bg-[var(--color-surface-2)] hover:text-[var(--color-text)] md:flex"
              aria-label="Déployer la barre latérale"
            >
              <PanelLeftOpen size={16} />
            </button>
          )
        ) : (
          <div className="rounded-md bg-[var(--color-surface-2)] px-3 py-2.5">
            <p className="text-[11px] font-semibold text-[var(--color-text)]">UE INF3421</p>
            <p className="mt-0.5 text-[11px] leading-relaxed text-[var(--color-muted)]">
              Langages formels & compilation
            </p>
          </div>
        )}
      </div>
    </nav>
  );
}
