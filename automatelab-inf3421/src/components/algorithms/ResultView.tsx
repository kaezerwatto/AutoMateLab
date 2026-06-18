"use client";
import { useRef } from "react";
import { AlertTriangle, Download, FileJson, Image as ImageIcon, ClipboardCopy } from "lucide-react";
import { AlgorithmResult, Automaton } from "@/core/types";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatPill } from "@/components/ui/misc";
import { AutomatonCanvas } from "@/components/automata/AutomatonCanvas";
import { TracePanel } from "./TracePanel";
import {
  downloadJson,
  downloadText,
  exportElementPng,
  traceToReportText,
} from "@/lib/export";

function isAutomaton(r: AlgorithmResult["result"]): r is Automaton {
  return typeof r !== "string" && r !== null && typeof r === "object";
}

export function ResultView({
  title,
  result,
  source,
  onApply,
}: {
  title: string;
  result: AlgorithmResult;
  source?: Automaton;
  onApply?: (a: Automaton) => void;
}) {
  const canvasRef = useRef<HTMLDivElement>(null);
  const automaton = isAutomaton(result.result) ? result.result : null;

  const copyTrace = async () => {
    const text = traceToReportText(title, result.steps, result.warnings);
    await navigator.clipboard.writeText(text);
  };

  return (
    <div className="space-y-4">
      {/* en-tête + actions */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <h3 className="text-sm font-semibold text-[var(--color-text)]">{title}</h3>
          {automaton && <Badge variant="primary">{automaton.kind}</Badge>}
        </div>
        <div className="flex flex-wrap gap-2">
          {automaton && onApply && (
            <Button size="sm" variant="primary" onClick={() => onApply(automaton)}>
              <Download size={14} /> Charger dans le Studio
            </Button>
          )}
          <Button
            size="sm"
            variant="secondary"
            onClick={() =>
              automaton
                ? downloadJson(automaton, `${automaton.name || "automate"}.json`)
                : downloadText(String(result.result), `${title}.txt`)
            }
          >
            <FileJson size={14} /> JSON
          </Button>
          {automaton && (
            <Button
              size="sm"
              variant="secondary"
              onClick={() => canvasRef.current && exportElementPng(canvasRef.current, `${title}.png`)}
            >
              <ImageIcon size={14} /> PNG
            </Button>
          )}
          <Button size="sm" variant="ghost" onClick={copyTrace}>
            <ClipboardCopy size={14} /> Copier la trace
          </Button>
        </div>
      </div>

      {/* résultat string (regex) */}
      {!automaton && (
        <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-5">
          <p className="text-xs uppercase tracking-wider text-[var(--color-faint)]">Résultat</p>
          <p className="mt-1 break-all font-mono text-xl text-[var(--color-primary-hover)]">
            {String(result.result)}
          </p>
        </div>
      )}

      {/* métriques */}
      {result.metrics && Object.keys(result.metrics).length > 0 && (
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-4">
          {Object.entries(result.metrics).map(([k, v]) => (
            <StatPill key={k} label={k} value={String(v)} />
          ))}
        </div>
      )}

      {/* avertissements */}
      {result.warnings.length > 0 && (
        <div className="space-y-1 rounded-lg border border-[var(--color-warning)]/30 bg-[var(--color-warning)]/10 p-3">
          {result.warnings.map((w, i) => (
            <p key={i} className="flex items-center gap-2 text-sm text-[var(--color-warning)]">
              <AlertTriangle size={14} /> {w}
            </p>
          ))}
        </div>
      )}

      {/* graphe résultat */}
      {automaton && (
        <div ref={canvasRef} className="h-[360px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
          <AutomatonCanvas
            automaton={automaton}
            highlight={result.steps.flatMap((s) => s.highlightStates ?? [])}
            dimNonHighlighted
          />
        </div>
      )}

      {/* comparaison avant/après */}
      {automaton && source && (
        <div className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--color-muted)]">Avant — {source.name}</p>
            <div className="h-[260px] overflow-hidden rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)]">
              <AutomatonCanvas automaton={source} />
            </div>
          </div>
          <div className="space-y-1">
            <p className="text-xs font-medium text-[var(--color-success)]">Après — {automaton.name}</p>
            <div className="h-[260px] overflow-hidden rounded-xl border border-[var(--color-success)]/30 bg-[var(--color-surface)]">
              <AutomatonCanvas automaton={automaton} />
            </div>
          </div>
        </div>
      )}

      {/* trace pédagogique */}
      <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
        <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Trace pédagogique</p>
        <TracePanel steps={result.steps} />
      </div>
    </div>
  );
}
