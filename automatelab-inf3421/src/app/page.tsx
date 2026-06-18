"use client";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  ArrowRight,
  CircleDot,
  Workflow,
  Regex,
  Sigma,
  Combine,
  FileText,
  Play,
  GitMerge,
  Minimize2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { EXAMPLES } from "@/core/examples";
import { LogoMark } from "@/components/layout/Logo";
import { useAutomatonStore } from "@/store/automaton-store";

const MODULES = [
  { href: "/lab", title: "Automate Studio", desc: "Créer et éditer un automate sur un canvas interactif.", icon: CircleDot },
  { href: "/workflow", title: "Workflow Studio", desc: "Chaîner les opérations comme un pipeline visuel.", icon: Workflow },
  { href: "/regex", title: "Regex Studio", desc: "Thompson, Glushkov et automate → expression régulière.", icon: Regex },
  { href: "/equations", title: "Equation Studio", desc: "Résoudre des systèmes d'équations avec le lemme d'Arden.", icon: Sigma },
  { href: "/closure", title: "Closure Studio", desc: "Union, intersection, complément, concaténation, étoile.", icon: Combine },
  { href: "/report", title: "Report Center", desc: "Exporter graphes, traces et synthèses pour le rapport.", icon: FileText },
];

export default function DashboardPage() {
  const router = useRouter();
  const setAutomaton = useAutomatonStore((s) => s.setAutomaton);

  const openExample = (id: string) => {
    const ex = EXAMPLES.find((e) => e.id === id);
    if (ex) {
      setAutomaton(ex.automaton);
      router.push("/lab");
    }
  };

  return (
    <div className="mx-auto max-w-7xl space-y-8 p-4 md:p-8">
      {/* HERO */}
      <section className="overflow-hidden rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]">
        <div className="flex flex-col gap-6 p-6 md:flex-row md:items-center md:justify-between md:p-8">
          <div className="max-w-2xl space-y-4">
            <Badge variant="primary">Laboratoire d&apos;automates · INF3421</Badge>
            <h1 className="text-2xl font-bold leading-tight tracking-tight text-[var(--color-text)] md:text-4xl">
              Construisez, transformez et visualisez vos automates.
            </h1>
            <p className="text-sm leading-relaxed text-[var(--color-muted)] md:text-base">
              Un éditeur visuel pour manipuler AFD, AFN et ε-AFN : déterminisation, minimisation,
              ε-fermetures, Thompson, Glushkov, clôtures et exports — dans une interface claire et
              pédagogique.
            </p>
            <div className="flex flex-wrap gap-3 pt-1">
              <Link href="/lab">
                <Button variant="primary" size="lg">
                  <CircleDot size={18} /> Ouvrir l&apos;Automate Studio
                </Button>
              </Link>
              <Link href="/workflow">
                <Button variant="secondary" size="lg">
                  <Play size={18} /> Lancer un workflow
                </Button>
              </Link>
            </div>
          </div>
          <div className="hidden shrink-0 md:block">
            <div className="flex h-[182px] w-[182px] items-center justify-center rounded-xl border border-[var(--color-border)] bg-[var(--color-bg)] dotgrid">
              <LogoMark size={104} />
            </div>
          </div>
        </div>
      </section>

      {/* MODULES */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Modules</h2>
          <p className="text-sm text-[var(--color-muted)]">Six espaces de travail spécialisés.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((m) => {
            const Icon = m.icon;
            return (
              <Link key={m.href} href={m.href} className="group">
                <Card className="h-full transition-colors hover:border-[var(--color-primary)]/40">
                  <CardContent className="flex h-full flex-col gap-3 p-5">
                    <div className="flex items-center justify-between">
                      <span className="flex h-10 w-10 items-center justify-center rounded-lg bg-[var(--color-elevated)] text-[var(--color-primary)]">
                        <Icon size={19} />
                      </span>
                      <ArrowRight
                        size={17}
                        className="text-[var(--color-faint)] transition-transform group-hover:translate-x-0.5 group-hover:text-[var(--color-primary)]"
                      />
                    </div>
                    <div>
                      <h3 className="font-medium text-[var(--color-text)]">{m.title}</h3>
                      <p className="mt-1 text-sm text-[var(--color-muted)]">{m.desc}</p>
                    </div>
                  </CardContent>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>

      {/* EXEMPLES */}
      <section className="space-y-4">
        <div>
          <h2 className="text-lg font-semibold text-[var(--color-text)]">Exemples du cours & TD</h2>
          <p className="text-sm text-[var(--color-muted)]">Chargez un exemple en un clic.</p>
        </div>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          {EXAMPLES.map((ex) => (
            <Card key={ex.id} className="flex flex-col">
              <CardContent className="flex flex-1 flex-col gap-3 p-5">
                <div className="flex items-center gap-2">
                  <Badge variant="primary">{ex.automaton.kind}</Badge>
                  <span className="text-xs text-[var(--color-faint)]">{ex.automaton.states.length} états</span>
                </div>
                <h3 className="font-medium text-[var(--color-text)]">{ex.title}</h3>
                <p className="flex-1 text-sm text-[var(--color-muted)]">{ex.description}</p>
                <Button variant="outline" size="sm" onClick={() => openExample(ex.id)} className="w-fit">
                  Charger l&apos;exemple <ArrowRight size={14} />
                </Button>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      {/* PIPELINE DEMO */}
      <section className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] p-6">
        <h2 className="mb-4 text-base font-semibold text-[var(--color-text)]">Scénario de démonstration</h2>
        <div className="flex flex-wrap items-center gap-2 text-sm">
          {[
            { label: "Importer (a+b)*abb", icon: CircleDot },
            { label: "AFN → AFD", icon: GitMerge },
            { label: "Minimiser", icon: Minimize2 },
            { label: "Exporter", icon: FileText },
          ].map((s, i, arr) => (
            <div key={s.label} className="flex items-center gap-2">
              <span className="inline-flex items-center gap-2 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-3 py-2 text-[var(--color-text)]">
                <s.icon size={15} className="text-[var(--color-primary)]" />
                {s.label}
              </span>
              {i < arr.length - 1 && <ArrowRight size={16} className="text-[var(--color-faint)]" />}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
