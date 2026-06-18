"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Workflow, Network, Wand2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Input, Label } from "@/components/ui/input";
import { ResultView } from "@/components/algorithms/ResultView";
import { thompson } from "@/core/thompson";
import { glushkov } from "@/core/glushkov";
import { AlgorithmResult } from "@/core/types";
import { REGEX_EXAMPLES } from "@/core/examples";
import { useAutomatonStore } from "@/store/automaton-store";

export default function RegexPage() {
  const router = useRouter();
  const setAutomaton = useAutomatonStore((s) => s.setAutomaton);
  const [expr, setExpr] = useState("(a+b)*abb");
  const [result, setResult] = useState<{ title: string; result: AlgorithmResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const run = (kind: "thompson" | "glushkov") => {
    try {
      setError(null);
      const r = kind === "thompson" ? thompson(expr) : glushkov(expr);
      setResult({ title: kind === "thompson" ? "Thompson" : "Glushkov", result: r });
    } catch (e) {
      setError((e as Error).message);
      setResult(null);
    }
  };

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Card>
        <CardContent className="space-y-4 p-5">
          <div>
            <Label>Expression régulière</Label>
            <div className="flex flex-col gap-2 sm:flex-row">
              <Input
                value={expr}
                onChange={(e) => setExpr(e.target.value)}
                placeholder="(a+b)*abb"
                className="font-mono"
              />
              <div className="flex gap-2">
                <Button variant="primary" onClick={() => run("thompson")}>
                  <Workflow size={16} /> Thompson
                </Button>
                <Button variant="secondary" onClick={() => run("glushkov")}>
                  <Network size={16} /> Glushkov
                </Button>
              </div>
            </div>
            <p className="mt-2 text-xs text-[var(--color-muted)]">
              Syntaxe : <code className="text-[var(--color-primary-hover)]">+</code> union ·{" "}
              <code className="text-[var(--color-primary-hover)]">*</code> étoile · concaténation
              implicite · <code className="text-[var(--color-primary-hover)]">( )</code> groupes ·{" "}
              <code className="text-[var(--color-primary-hover)]">ε</code> mot vide.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-[var(--color-faint)]">Exemples :</span>
            {REGEX_EXAMPLES.map((ex) => (
              <button
                key={ex}
                onClick={() => setExpr(ex)}
                className="rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-2.5 py-1 font-mono text-xs text-[var(--color-text)] hover:bg-[var(--color-surface-2)]"
              >
                {ex}
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

      {!result && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardContent className="space-y-2 p-5">
              <Badge variant="warning">
                <Wand2 size={12} /> Thompson
              </Badge>
              <p className="text-sm text-[var(--color-muted)]">
                Construit un ε-AFN avec un état initial et un état final uniques, par composition
                récursive (symbole, union, concaténation, étoile).
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="space-y-2 p-5">
              <Badge variant="cyan">
                <Network size={12} /> Glushkov
              </Badge>
              <p className="text-sm text-[var(--color-muted)]">
                Construit un automate de positions sans ε, via nullable, firstpos, lastpos et
                followpos.
              </p>
            </CardContent>
          </Card>
        </div>
      )}

      {result && (
        <Card>
          <CardContent className="p-5">
            <ResultView
              title={`${result.title} — ${expr}`}
              result={result.result}
              onApply={(a) => {
                setAutomaton(a);
                router.push("/lab");
              }}
            />
          </CardContent>
        </Card>
      )}
    </div>
  );
}
