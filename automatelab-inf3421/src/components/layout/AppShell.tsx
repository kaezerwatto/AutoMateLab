"use client";
import { useState } from "react";
import { X } from "lucide-react";
import { cn } from "@/lib/utils";
import { SidebarNav } from "./SidebarNav";
import { Topbar } from "./Topbar";

export function AppShell({ children }: { children: React.ReactNode }) {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      {/* Sidebar desktop */}
      <aside
        className={cn(
          "hidden shrink-0 border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-[width] duration-200 md:block",
          collapsed ? "w-16" : "w-64",
        )}
      >
        <SidebarNav collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      </aside>

      {/* Sidebar mobile */}
      <div
        className={cn(
          "fixed inset-0 z-50 md:hidden",
          mobileOpen ? "pointer-events-auto" : "pointer-events-none",
        )}
      >
        <div
          className={cn(
            "absolute inset-0 bg-black/60 transition-opacity",
            mobileOpen ? "opacity-100" : "opacity-0",
          )}
          onClick={() => setMobileOpen(false)}
        />
        <aside
          className={cn(
            "absolute left-0 top-0 h-full w-64 border-r border-[var(--color-border)] bg-[var(--color-surface)] transition-transform",
            mobileOpen ? "translate-x-0" : "-translate-x-full",
          )}
        >
          <button
            className="absolute right-3 top-3 z-10 text-[var(--color-muted)]"
            onClick={() => setMobileOpen(false)}
            aria-label="Fermer"
          >
            <X size={18} />
          </button>
          <SidebarNav onNavigate={() => setMobileOpen(false)} />
        </aside>
      </div>

      {/* Contenu */}
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar onMenu={() => setMobileOpen(true)} />
        <main className="min-h-0 flex-1 overflow-auto">{children}</main>
      </div>
    </div>
  );
}
