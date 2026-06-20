"use client";
import { useMemo, useRef, useState } from "react";
import { Sigma, Play, AlertCircle, ClipboardCopy, Upload, Keyboard, Eraser } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Textarea, Label } from "@/components/ui/input";
import { TracePanel } from "@/components/algorithms/TracePanel";
import { solveArden } from "@/core/arden-solver";
import { AlgorithmResult } from "@/core/types";
import { EQUATION_EXAMPLES } from "@/core/examples";
import { traceToReportText } from "@/lib/export";

const SYMBOLS = ["ε", "∅", "+", "*", "(", ")", "="];
const TEMPLATES = ["X = aX + bY + ε", "Y = aY + b", "Z = aZ + ε"];

function normalizeTypedSymbols(value: string): string {
  return value
    .replace(/\b(expsilon|epsilon|eps|varepsilon|lambda|mot\s+vide)\b/gi, "ε")
    .replace(/λ|&/g, "ε")
    .replace(/→|⇒|:=/g, "=")
    .replace(/·/g, "");
}

export default function EquationsPage() {
  const [text, setText] = useState(EQUATION_EXAMPLES[0]);
  const [target, setTarget] = useState("X");
  const [result, setResult] = useState<AlgorithmResult<string> | null>(null);
  const [error, setError] = useState<string | null>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const variables = useMemo(() => {
    const found = text
      .split("\n")
      .map((line) => line.split("=")[0]?.trim())
      .filter((name): name is string => /^[A-Z][A-Z0-9_]*$/.test(name));
    return [...new Set(found)];
  }, [text]);

  const selectedTarget = variables.includes(target) ? target : variables[0] ?? "X";

  const insertText = (snippet: string) => {
    const textarea = textareaRef.current;
    if (!textarea) {
      setText((value) => `${value}${snippet}`);
      return;
    }
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    setText((value) => `${value.slice(0, start)}${snippet}${value.slice(end)}`);
    requestAnimationFrame(() => {
      textarea.focus();
      const next = start + snippet.length;
      textarea.setSelectionRange(next, next);
    });
  };

  const importEquations = async (file: File) => {
    const content = await file.text();
    setText(normalizeTypedSymbols(content));
    setResult(null);
    setError(null);
  };

  const solve = () => {
    try {
      setError(null);
      const normalized = normalizeTypedSymbols(text);
      setText(normalized);
      const lines = normalized
        .split("\n")
        .map((l) => l.trim())
        .filter(Boolean);
      if (!lines.length) throw new Error("Saisissez au moins une équation.");
      setResult(solveArden(lines, selectedTarget));
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  return (
    <div className="mx-auto w-full max-w-6xl space-y-6 p-3 sm:p-4 md:p-8">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
              <Label>Système d'équations de langages (une par ligne)</Label>
              <div className="flex items-center gap-2">
                <Label className="mb-0">Variable cible</Label>
                <select
                  value={selectedTarget}
                  onChange={(e) => setTarget(e.target.value)}
                  className="h-8 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2 font-mono text-xs text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none"
                >
                  {(variables.length ? variables : ["X"]).map((name) => (
                    <option key={name} value={name}>
                      {name}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <Textarea
              ref={textareaRef}
              value={text}
              onChange={(e) => setText(e.target.value)}
              rows={8}
              placeholder={"X = aX + bY + ε\nY = aY + bX"}
              spellCheck={false}
              className="min-h-56 resize-y text-[13px] leading-6 sm:text-sm"
            />
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Variables en MAJUSCULES, symboles terminaux en minuscules. Vous pouvez saisir{" "}
              <code className="text-[var(--color-primary-hover)]">epsilon</code>,{" "}
              <code className="text-[var(--color-primary-hover)]">eps</code>,{" "}
              <code className="text-[var(--color-primary-hover)]">&</code> ou{" "}
              <code className="text-[var(--color-primary-hover)]">λ</code> : ils seront remplacés par ε.
              Lemme d'Arden : si{" "}
              <code className="text-[var(--color-primary-hover)]">X = AX + B</code> et ε ∉ A, alors{" "}
              <code className="text-[var(--color-primary-hover)]">X = A*B</code>.
            </p>
          </div>

          <div className="flex flex-col gap-3 rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)]/70 p-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
              <span className="flex items-center gap-1 text-xs text-[var(--color-faint)]">
                <Keyboard size={13} /> Symboles
              </span>
              {SYMBOLS.map((symbol) => (
                <button
                  key={symbol}
                  type="button"
                  title={`Insérer ${symbol}`}
                  onClick={() => insertText(symbol)}
                  className="flex h-8 min-w-8 items-center justify-center rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 font-mono text-sm text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  {symbol}
                </button>
              ))}
              {TEMPLATES.map((snippet) => (
                <button
                  key={snippet}
                  type="button"
                  onClick={() => insertText(`${text.endsWith("\n") || !text ? "" : "\n"}${snippet}`)}
                  className="h-8 rounded-md border border-[var(--color-border)] bg-[var(--color-surface-2)] px-2 font-mono text-xs text-[var(--color-text)] transition-colors hover:border-[var(--color-primary)] hover:text-[var(--color-primary-hover)]"
                >
                  {snippet.split("=")[0].trim()} = ...
                </button>
              ))}
            </div>
            <div className="flex shrink-0 flex-wrap gap-2">
              <Button size="sm" variant="secondary" onClick={() => fileRef.current?.click()}>
                <Upload size={14} /> Importer
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setText(normalizeTypedSymbols(text))}>
                <Eraser size={14} /> Normaliser
              </Button>
              <input
                ref={fileRef}
                type="file"
                accept=".txt,.eq,.csv,text/plain"
                hidden
                onChange={(e) => e.target.files?.[0] && importEquations(e.target.files[0])}
              />
            </div>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <Button variant="primary" onClick={solve}>
              <Play size={16} /> Résoudre
            </Button>
            <span className="text-xs text-[var(--color-faint)]">Exemples :</span>
            {EQUATION_EXAMPLES.map((ex, i) => (
              <button
                key={i}
                onClick={() => {
                  setText(ex);
                  setTarget("X");
                  setResult(null);
                  setError(null);
                }}
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
