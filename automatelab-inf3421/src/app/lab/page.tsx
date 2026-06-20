"use client";
import { useRef, useState } from "react";
import {
  Plus,
  LayoutGrid,
  Upload,
  Download,
  Eraser,
  Radar,
  Scissors,
  SquarePlus,
  GitMerge,
  Minimize2,
  Hash,
  Regex,
  FlipHorizontal2,
  CircleDot,
  GitFork,
  FolderOpen,
  Save,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AutomatonCanvas } from "@/components/automata/AutomatonCanvas";
import { AutomatonInspector } from "@/components/automata/AutomatonInspector";
import { ResultView } from "@/components/algorithms/ResultView";
import { useAutomatonStore } from "@/store/automaton-store";
import { AlgorithmResult, Automaton } from "@/core/types";
import { parseAutomatonJson } from "@/core/validators";
import { analyzeStates, accessibleReport, coAccessibleReport } from "@/core/accessible";
import { trimAutomaton } from "@/core/trim";
import { completeDfa } from "@/core/complete-dfa";
import { nfaToDfa } from "@/core/nfa-to-dfa";
import { enfaToDfa } from "@/core/enfa-to-dfa";
import { dfaToNfa, nfaToEnfa, dfaToEnfa } from "@/core/dfa-to-nfa";
import { enfaToNfa } from "@/core/enfa-to-nfa";
import { minimizeDfa } from "@/core/minimize";
import { canonize } from "@/core/canonize";
import { automatonToRegex } from "@/core/automaton-to-regex";
import { complementAutomaton } from "@/core/closure-operations";
import { epsilonClosureReport, epsilonClosureOfReport } from "@/core/epsilon-closure";
import { autoLayout } from "@/lib/layout";
import { downloadJson } from "@/lib/export";
import { EXAMPLES } from "@/core/examples";
import { Badge } from "@/components/ui/badge";

interface Op {
  key: string;
  label: string;
  icon: React.ElementType;
  run: (a: Automaton) => AlgorithmResult;
}

const OPS: Op[] = [
  { key: "accessible", label: "Accessibles", icon: Radar, run: accessibleReport },
  { key: "coAccessible", label: "Co-accessibles", icon: Radar, run: coAccessibleReport },
  { key: "analyze", label: "Utiles (analyse)", icon: Radar, run: analyzeStates },
  { key: "trim", label: "Émonder", icon: Scissors, run: trimAutomaton },
  { key: "complete", label: "Compléter (AFDC)", icon: SquarePlus, run: completeDfa },
  { key: "nfaToDfa", label: "AFN → AFD", icon: GitMerge, run: nfaToDfa },
  { key: "enfaToDfa", label: "ε-AFN → AFD", icon: GitMerge, run: enfaToDfa },
  { key: "dfaToNfa", label: "AFD → AFN", icon: GitFork, run: dfaToNfa },
  { key: "nfaToEnfa", label: "AFN → ε-AFN", icon: GitFork, run: nfaToEnfa },
  { key: "dfaToEnfa", label: "AFD → ε-AFN", icon: GitFork, run: dfaToEnfa },
  { key: "enfaToNfa", label: "ε-AFN → AFN", icon: GitMerge, run: enfaToNfa },
  { key: "epsilon", label: "ε-fermeture", icon: CircleDot, run: epsilonClosureReport },
  { key: "minimize", label: "Minimiser", icon: Minimize2, run: minimizeDfa },
  { key: "canonize", label: "Canoniser", icon: Hash, run: canonize },
  { key: "toRegex", label: "→ Regex", icon: Regex, run: automatonToRegex },
  { key: "complement", label: "Complément", icon: FlipHorizontal2, run: complementAutomaton },
];

export default function LabPage() {
  const {
    current,
    selectedStateId,
    highlight,
    setAutomaton,
    addState,
    moveState,
    addTransition,
    select,
    setHighlight,
    clearHighlight,
    applyResult,
  } = useAutomatonStore();

  const fileRef = useRef<HTMLInputElement>(null);
  const [dialog, setDialog] = useState<{ title: string; result: AlgorithmResult } | null>(null);
  const [examplesOpen, setExamplesOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const runOp = (op: Op) => {
    try {
      setError(null);
      const source = current;
      // ε-fermeture : si un état est sélectionné, on cible cet état précis.
      const result =
        op.key === "epsilon" && selectedStateId
          ? epsilonClosureOfReport(source, selectedStateId)
          : op.run(source);

      if (op.key === "analyze") {
        const useful = result.steps.find((s) => s.title.includes("utiles"))?.highlightStates;
        if (useful) setHighlight(useful);
      } else if (op.key === "accessible" || op.key === "coAccessible" || op.key === "epsilon") {
        const hl = result.steps.flatMap((s) => s.highlightStates ?? []);
        if (hl.length) setHighlight(hl);
      }
      setDialog({ title: op.label, result });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const onImport = async (file: File) => {
    try {
      const text = await file.text();
      setAutomaton(parseAutomatonJson(text));
      setError(null);
    } catch (e) {
      setError((e as Error).message);
    }
  };

  return (
    <div className="flex h-full min-h-[calc(100dvh-4rem)] flex-col">
      {/* Toolbar */}
      <div className="shrink-0 border-b border-[var(--color-border)] bg-[var(--color-surface)]/50 p-3">
        <div className="flex flex-wrap items-center gap-2">
          <Button size="sm" variant="primary" onClick={() => addState()}>
            <Plus size={15} /> État
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setAutomaton(autoLayout(current))}>
            <LayoutGrid size={15} /> Auto-layout
          </Button>
          <Button size="sm" variant="secondary" onClick={() => setExamplesOpen(true)}>
            <FolderOpen size={15} /> Exemples
          </Button>
          <Button size="sm" variant="ghost" onClick={() => fileRef.current?.click()}>
            <Upload size={15} /> Importer
          </Button>
          <Button size="sm" variant="ghost" onClick={() => downloadJson(current, current.name)}>
            <Download size={15} /> Exporter
          </Button>
          {highlight.length > 0 && (
            <Button size="sm" variant="ghost" onClick={clearHighlight}>
              <Eraser size={15} /> Effacer surbrillance
            </Button>
          )}
          <input
            ref={fileRef}
            type="file"
            accept="application/json,.json"
            hidden
            onChange={(e) => e.target.files?.[0] && onImport(e.target.files[0])}
          />

          <div className="mx-1 hidden h-6 w-px bg-[var(--color-border)] sm:block" />

          <div className="-mx-3 mt-1 w-[calc(100%+1.5rem)] overflow-x-auto px-3 pb-1 sm:mx-0 sm:mt-0 sm:w-auto sm:overflow-visible sm:px-0 sm:pb-0">
            <div className="flex w-max items-center gap-1.5 sm:w-auto sm:flex-wrap">
              {OPS.map((op) => (
                <Button
                  key={op.key}
                  size="sm"
                  variant="outline"
                  onClick={() => runOp(op)}
                  className="shrink-0"
                >
                  <op.icon size={14} /> {op.label}
                </Button>
              ))}
            </div>
          </div>
        </div>
      </div>

      {error && (
        <div className="border-b border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 px-4 py-2 text-sm text-[var(--color-danger)]">
          {error}
        </div>
      )}

      {/* Canvas + inspector */}
      <div className="flex min-h-0 flex-1 flex-col overflow-hidden lg:flex-row">
        <div className="relative min-h-[360px] min-w-0 flex-1 lg:min-h-0">
          <AutomatonCanvas
            className="absolute inset-0"
            automaton={current}
            highlight={highlight}
            dimNonHighlighted={highlight.length > 0}
            selectedStateId={selectedStateId}
            editable
            onMoveState={moveState}
            onConnectStates={addTransition}
            onSelectState={(id) => select(id, undefined)}
            onSelectTransition={(id) => {
              // id de groupe « from->to » : on cible la 1re transition correspondante
              if (!id) return select(undefined, undefined);
              const [from, to] = id.split("->");
              const t = current.transitions.find((x) => x.from === from && x.to === to);
              select(undefined, t?.id);
            }}
          />
          <div className="pointer-events-none absolute left-4 top-4 flex items-center gap-2">
            <Badge variant="accent">{current.name}</Badge>
          </div>
        </div>

        <aside className="h-[min(38dvh,22rem)] min-h-64 shrink-0 overflow-hidden border-t border-[var(--color-border)] bg-[var(--color-surface)]/40 lg:hidden">
          <AutomatonInspector />
        </aside>

        <aside className="hidden w-80 shrink-0 border-l border-[var(--color-border)] bg-[var(--color-surface)]/40 lg:block">
          <AutomatonInspector />
        </aside>
      </div>

      {/* Résultat d'opération */}
      <Dialog
        open={Boolean(dialog)}
        onClose={() => setDialog(null)}
        title={dialog?.title}
        description="Résultat, graphe, métriques et trace pédagogique."
      >
        {dialog && (
          <ResultView
            title={dialog.title}
            result={dialog.result}
            source={current}
            onApply={(a) => {
              applyResult(dialog.title, { ...dialog.result, result: a });
              setDialog(null);
            }}
          />
        )}
      </Dialog>

      {/* Exemples */}
      <Dialog
        open={examplesOpen}
        onClose={() => setExamplesOpen(false)}
        title="Charger un exemple"
        description="Exemples issus du cours et des TD INF3421."
        className="max-w-2xl"
      >
        <div className="grid gap-3 sm:grid-cols-2">
          {EXAMPLES.map((ex) => (
            <button
              key={ex.id}
              onClick={() => {
                setAutomaton(ex.automaton);
                setExamplesOpen(false);
              }}
              className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4 text-left transition-colors hover:bg-[var(--color-surface-2)]"
            >
              <div className="mb-1 flex items-center gap-2">
                <Badge variant="primary">{ex.automaton.kind}</Badge>
                <Save size={13} className="text-[var(--color-faint)]" />
              </div>
              <p className="font-medium text-[var(--color-text)]">{ex.title}</p>
              <p className="mt-1 text-sm text-[var(--color-muted)]">{ex.description}</p>
            </button>
          ))}
        </div>
      </Dialog>
    </div>
  );
}
