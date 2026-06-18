"use client";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { Menu, Sparkles, Database, HardDrive, BookOpen } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const TITLES: Record<string, { title: string; subtitle: string }> = {
  "/": { title: "Tableau de bord", subtitle: "Laboratoire d'automates finis" },
  "/lab": { title: "Automate Studio", subtitle: "Édition graphique d'états et transitions" },
  "/workflow": { title: "Workflow Studio", subtitle: "Pipeline visuel d'opérations sur les automates" },
  "/regex": { title: "Regex Studio", subtitle: "Expressions régulières → automates" },
  "/equations": { title: "Equation Studio", subtitle: "Systèmes d'équations & lemme d'Arden" },
  "/closure": { title: "Closure Studio", subtitle: "Opérations de clôture entre langages" },
  "/report": { title: "Report Center", subtitle: "Exports & synthèse pour le rapport" },
};

export function Topbar({ onMenu }: { onMenu: () => void }) {
  const pathname = usePathname();
  const key = pathname === "/" ? "/" : `/${pathname.split("/")[1]}`;
  const meta = TITLES[key] ?? TITLES["/"];
  const connected = isSupabaseConfigured();

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between gap-4 border-b border-[var(--color-border)] bg-[var(--color-bg)]/80 px-4 backdrop-blur-xl md:px-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" className="md:hidden" onClick={onMenu} aria-label="Menu">
          <Menu size={18} />
        </Button>
        <div>
          <h1 className="text-base font-semibold leading-tight text-[var(--color-text)] md:text-lg">
            {meta.title}
          </h1>
          <p className="hidden text-xs text-[var(--color-muted)] sm:block">{meta.subtitle}</p>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {connected ? (
          <Badge variant="success" className="hidden sm:inline-flex">
            <Database size={12} /> Supabase connecté
          </Badge>
        ) : (
          <Badge variant="warning" className="hidden sm:inline-flex">
            <HardDrive size={12} /> Stockage local
          </Badge>
        )}
        <Link href="/report">
          <Button variant="ghost" size="sm" className="hidden md:inline-flex">
            <BookOpen size={15} /> Aide
          </Button>
        </Link>
        <Link href="/workflow">
          <Button variant="primary" size="sm">
            <Sparkles size={15} /> Démo
          </Button>
        </Link>
      </div>
    </header>
  );
}
