"use client";
import { FileJson, FileText, ClipboardCopy, CheckCircle2, Database } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { DataTable } from "@/components/ui/misc";
import { useAutomatonStore } from "@/store/automaton-store";
import { automatonToReportText, downloadJson, downloadText } from "@/lib/export";
import { isSupabaseConfigured } from "@/lib/supabase/client";

const REPORT_PLAN = [
  { pages: "1", contenu: "Page de garde + résumé du projet" },
  { pages: "2", contenu: "Objectifs du TP et choix de la stack Next.js" },
  { pages: "3", contenu: "Architecture globale et modèle de données" },
  { pages: "4", contenu: "Interface workflow et Automate Canvas" },
  { pages: "5", contenu: "Conversions AFN/ε-AFN → AFD et ε-fermetures" },
  { pages: "6", contenu: "Accessibles, co-accessibles, utiles, émondage, AFDC" },
  { pages: "7", contenu: "Minimisation, canonisation et clôtures" },
  { pages: "8", contenu: "Thompson, Glushkov, automate → regex" },
  { pages: "9", contenu: "Tests, captures, validation des résultats" },
  { pages: "10", contenu: "Conclusion, limites, perspectives" },
];

const CHECKLIST = [
  "Le projet démarre avec bun run dev",
  "Le build passe avec bun run build",
  "Les tests passent avec bun run test",
  "Au moins un workflow complet fonctionne de bout en bout",
  "Les exports (PNG/JSON/trace) sont lisibles",
  "Le README contient installation, fonctionnalités, stack, auteurs",
];

const PARTICIPATION = [
  { membre: "AZAB A RANGA FRANCK MIGUEL", tâches: "Cahier des charges, architecture, moteur, intégration UI, rapport", "%": "—" },
  { membre: "Membre 2", tâches: "À compléter", "%": "—" },
  { membre: "Membre 3", tâches: "À compléter", "%": "—" },
  { membre: "Membre 4", tâches: "À compléter", "%": "—" },
];

export default function ReportPage() {
  const { current, history } = useAutomatonStore();
  const connected = isSupabaseConfigured();

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      {/* Exports rapides */}
      <Card>
        <CardContent className="space-y-4 p-5">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Exports pour le rapport</h2>
          <p className="text-sm text-[var(--color-muted)]">
            Automate courant : <span className="font-medium text-[var(--color-text)]">{current.name}</span>{" "}
            <Badge variant="primary">{current.kind}</Badge>
          </p>
          <div className="flex flex-wrap gap-2">
            <Button variant="secondary" onClick={() => downloadJson(current, current.name)}>
              <FileJson size={15} /> Exporter JSON
            </Button>
            <Button variant="secondary" onClick={() => downloadText(automatonToReportText(current), `${current.name}.txt`)}>
              <FileText size={15} /> Exporter description texte
            </Button>
            <Button variant="ghost" onClick={() => navigator.clipboard.writeText(automatonToReportText(current))}>
              <ClipboardCopy size={15} /> Copier la description
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Historique */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Historique des opérations</h2>
          {history.length === 0 ? (
            <p className="text-sm text-[var(--color-muted)]">
              Aucune opération exécutée pour l'instant. Lancez des algorithmes dans l'Automate Studio.
            </p>
          ) : (
            <ul className="space-y-2">
              {history.map((h, i) => (
                <li key={i} className="flex items-center justify-between rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 py-2 text-sm">
                  <span className="text-[var(--color-text)]">{h.label}</span>
                  <span className="text-xs text-[var(--color-faint)]">
                    {new Date(h.at).toLocaleTimeString("fr-FR")}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Plan du rapport */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Plan du rapport (10 pages)</h2>
            <DataTable rows={REPORT_PLAN} />
          </CardContent>
        </Card>

        {/* Checklist */}
        <Card>
          <CardContent className="space-y-3 p-5">
            <h2 className="text-lg font-bold text-[var(--color-text)]">Checklist de livraison</h2>
            <ul className="space-y-2">
              {CHECKLIST.map((c) => (
                <li key={c} className="flex items-start gap-2 text-sm text-[var(--color-muted)]">
                  <CheckCircle2 size={16} className="mt-0.5 shrink-0 text-[var(--color-success)]" />
                  {c}
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      </div>

      {/* Participation */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <h2 className="text-lg font-bold text-[var(--color-text)]">Tableau de participation</h2>
          <DataTable rows={PARTICIPATION} />
        </CardContent>
      </Card>

      {/* Supabase */}
      <Card>
        <CardContent className="space-y-3 p-5">
          <div className="flex items-center gap-2">
            <Database size={18} className="text-[var(--color-primary-hover)]" />
            <h2 className="text-lg font-bold text-[var(--color-text)]">Base de données Supabase</h2>
            <Badge variant={connected ? "success" : "warning"}>
              {connected ? "Connectée" : "Mode local"}
            </Badge>
          </div>
          <ol className="list-decimal space-y-1.5 pl-5 text-sm text-[var(--color-muted)]">
            <li>Créez un projet sur supabase.com.</li>
            <li>Exécutez <code className="text-[var(--color-primary-hover)]">supabase/schema.sql</code> puis <code className="text-[var(--color-primary-hover)]">supabase/seed.sql</code> dans l'éditeur SQL.</li>
            <li>Ajoutez le schéma <code className="text-[var(--color-primary-hover)]">automatelab</code> dans Settings → API → Exposed schemas.</li>
            <li>Copiez <code className="text-[var(--color-primary-hover)]">.env.local.example</code> en <code className="text-[var(--color-primary-hover)]">.env.local</code> et renseignez l'URL et la clé anon.</li>
            <li>Relancez <code className="text-[var(--color-primary-hover)]">bun run dev</code>.</li>
          </ol>
        </CardContent>
      </Card>
    </div>
  );
}
