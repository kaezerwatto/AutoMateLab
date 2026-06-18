"use client";
import { useState } from "react";
import { Sigma, Play, AlertCircle, ClipboardCopy } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/input";
import { TracePanel } from "@/components/algorithms/TracePanel";
import { solveArden } from "@/core/arden-solver";
import { AlgorithmResult } from "@/core/types";
import { EQUATION_EXAMPLES } from "@/core/examples";
import { traceToReportText } from "@/lib/export";

export default function EquationsPage() {
  const [text, setText] = useState(EQUATION_EXAMPLES[0]);
  const [result, setResult] = useState<AlgorithmResult<string> | null>(null);
  const [error, setError] = useState<string | null>(null);

  const solve = () => {
    try {
      setError(null);
      const lines = text
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) throw new Error("Saisissez au moins une équation.");
      setResult(solveArden(lines));
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-5xl space-y-6 p-4 md:p-8">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <Label>Système d'équations de langages (une par ligne)</Label>
            <Textarea
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={6}
              placeholder={"X = aX + bY + ε\nY = aY + bX"}
            />
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Variables en MAJUSCULES, symboles en minuscules. Lemme d'Arden : si{" "}
              <code className="text-[var(--color-primary-hover)]">X = AX + B</code> et ε ∉ A, alors{" "}
              <code className="text-[var(--color-primary-hover)]">X = A*B</code>.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={solve}>
              <Play size={16} /> Résoudre
            </Button>
            <span className="text-xs text-[var(--color-faint)]">Exemples :</span>
            {EQUATION_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => setText(ex)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              >
                Exemple {i + 1}
              </button>
            ))}
          </div>

          {error && (
            <div className="flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]">
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="space-y-4 p-5">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                <Sigma size={18} className="text-[var(--color-primary-hover)]" />
                <h3 className="text-sm font-semibold text-[var(--color-text)]">Solution</h3>
              </div>
              <Button
                size="sm"
                variant="ghost"
                onClick={() =>
                  navigator.clipboard.writeText(
                    traceToReportText("Résolution Arden", result.steps, result.warnings),
                  )
                }
              >
                <ClipboardCopy size={14} /> Copier la trace
              </Button>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="text-xs uppercase tracking-wider text-[var(--color-faint)]">
                Expression régulière (variable {String(result.metrics?.cible)})
              </p>
              <p className="mt-1 break-all font-mono text-xl text-[var(--color-primary-hover)]">
                {result.result}
              </p>
            </div>
            <div className="rounded-xl border border-[var(--color-border)] bg-[var(--color-surface)] p-4">
              <p className="mb-3 text-sm font-semibold text-[var(--color-text)]">Étapes</p>
              <TracePanel steps={result.steps} />
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
