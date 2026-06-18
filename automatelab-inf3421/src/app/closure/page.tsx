"use client";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { Combine, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Label } from "@/components/ui/input";
import { ResultView } from "@/components/algorithms/ResultView";
import { AlgorithmResult, Automaton } from "@/core/types";
import { EXAMPLES } from "@/core/examples";
import { useAutomatonStore } from "@/store/automaton-store";
import {
  complementAutomaton,
  concatAutomata,
  differenceAutomata,
  intersectionAutomata,
  starAutomaton,
  unionAutomata,
} from "@/core/closure-operations";
import { cn } from "@/lib/utils";

type BinOp = "union" | "intersection" | "concat" | "difference";
type UnOp = "star" | "complement";

const BIN_OPS: { key: BinOp; label: string; symbol: string }[] = [
  { key: "union", label: "Union", symbol: "A ∪ B" },
  { key: "intersection", label: "Intersection", symbol: "A ∩ B" },
  { key: "concat", label: "Concaténation", symbol: "A · B" },
  { key: "difference", label: "Différence", symbol: "A \\ B" },
];
const UN_OPS: { key: UnOp; label: string; symbol: string }[] = [
  { key: "star", label: "Étoile", symbol: "A*" },
  { key: "complement", label: "Complément", symbol: "∁A" },
];

export default function ClosurePage() {
  const router = useRouter();
  const { current, setAutomaton } = useAutomatonStore();

  const options = useMemo(
    () => [
      { id: "__current__", name: `Automate courant — ${current.name}`, automaton: current },
      ...EXAMPLES.map((e) => ({ id: e.id, name: e.title, automaton: e.automaton })),
    ],
    [current],
  );

  const [aId, setAId] = useState("__current__");
  const [bId, setBId] = useState(EXAMPLES[0]?.id ?? "__current__");
  const [result, setResult] = useState<{ title: string; result: AlgorithmResult } | null>(null);
  const [error, setError] = useState<string | null>(null);

  const getA = (): Automaton => options.find((o) => o.id === aId)!.automaton;
  const getB = (): Automaton => options.find((o) => o.id === bId)!.automaton;

  const runBin = (op: BinOp) => {
    try {
      setError(null);
      const a = getA();
      const b = getB();
      const fn = { union: unionAutomata, intersection: intersectionAutomata, concat: concatAutomata, difference: differenceAutomata }[op];
      setResult({ title: BIN_OPS.find((o) => o.key === op)!.label, result: fn(a, b) });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const runUn = (op: UnOp) => {
    try {
      setError(null);
      const a = getA();
      const fn = { star: starAutomaton, complement: complementAutomaton }[op];
      setResult({ title: UN_OPS.find((o) => o.key === op)!.label, result: fn(a) });
    } catch (e) {
      setError((e as Error).message);
    }
  };

  const selectCls =
    "h-10 w-full rounded-lg border border-[var(--color-border)] bg-[var(--color-surface)] px-3 text-sm text-[var(--color-text)] focus:border-[var(--color-primary)] focus:outline-none";

  return (
    <div className="mx-auto max-w-6xl space-y-6 p-4 md:p-8">
      <Card>
        <CardContent className="space-y-5 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <Label>Automate A</Label>
              <select className={selectCls} value={aId} onChange={(e) => setAId(e.target.value)}>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
            <div>
              <Label>Automate B</Label>
              <select className={selectCls} value={bId} onChange={(e) => setBId(e.target.value)}>
                {options.map((o) => (
                  <option key={o.id} value={o.id}>{o.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)]">
              Opérations binaires (A et B)
            </p>
            <div className="flex flex-wrap gap-2">
              {BIN_OPS.map((op) => (
                <Button key={op.key} variant="secondary" onClick={() => runBin(op.key)}>
                  <Combine size={15} /> {op.label}
                  <span className="ml-1 font-mono text-xs text-[var(--color-faint)]">{op.symbol}</span>
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <p className="text-xs font-semibold uppercase tracking-wider text-[var(--color-faint)]">
              Opérations unaires (A)
            </p>
            <div className="flex flex-wrap gap-2">
              {UN_OPS.map((op) => (
                <Button key={op.key} variant="outline" onClick={() => runUn(op.key)}>
                  {op.label}
                  <span className="ml-1 font-mono text-xs text-[var(--color-faint)]">{op.symbol}</span>
                </Button>
              ))}
            </div>
          </div>

          {error && (
            <div className={cn("flex items-center gap-2 rounded-lg border border-[var(--color-danger)]/30 bg-[var(--color-danger)]/10 p-3 text-sm text-[var(--color-danger)]")}>
              <AlertCircle size={15} /> {error}
            </div>
          )}
        </CardContent>
      </Card>

      {result && (
        <Card>
          <CardContent className="p-5">
            <ResultView
              title={result.title}
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
