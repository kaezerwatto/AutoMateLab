/**
 * Automate → expression régulière par élimination d'états (automate généralisé).
 */
import { AlgorithmResult, Automaton, EPSILON, TraceRow, TraceStep } from "./types";
import { getFinalStates, getInitialStates } from "./graph-utils";

const EMPTY = "∅";
const EPS = "ε";

/** Union simplifiée de deux expressions. */
function rUnion(a: string, b: string): string {
  if (a === EMPTY) return b;
  if (b === EMPTY) return a;
  if (a === b) return a;
  return `(${a}+${b})`;
}

/** Concaténation simplifiée. */
function rConcat(a: string, b: string): string {
  if (a === EMPTY || b === EMPTY) return EMPTY;
  if (a === EPS) return b;
  if (b === EPS) return a;
  return `${a}${b}`;
}

/** Étoile simplifiée. */
function rStar(a: string): string {
  if (a === EMPTY || a === EPS) return EPS;
  return `(${a})*`;
}

export function automatonToRegex(a: Automaton): AlgorithmResult<string> {
  const warnings: string[] = [];
  const initials = getInitialStates(a);
  const finals = getFinalStates(a);
  if (initials.length === 0 || finals.length === 0) {
    return {
      result: EMPTY,
      steps: [
        {
          title: "Langage vide",
          description: "Pas d'état initial ou pas d'état final : L = ∅.",
        },
      ],
      warnings: ["Automate sans initial ou sans final."],
      metrics: {},
    };
  }

  // Nœuds : états + i (initial) + f (final)
  const I = "__i__";
  const F = "__f__";
  const nodes = [I, ...a.states.map((s) => s.id), F];

  // R[from][to]
  const R = new Map<string, Map<string, string>>();
  for (const p of nodes) {
    R.set(p, new Map());
    for (const q of nodes) R.get(p)!.set(q, EMPTY);
  }

  // Transitions existantes (fusion des parallèles)
  for (const t of a.transitions) {
    const sym = t.symbol === EPSILON ? EPS : t.symbol;
    const cur = R.get(t.from)!.get(t.to)!;
    R.get(t.from)!.set(t.to, rUnion(cur, sym));
  }
  // i -> chaque initial ; chaque final -> f
  for (const s of initials) R.get(I)!.set(s.id, EPS);
  for (const s of finals) R.get(s.id)!.set(F, EPS);

  const steps: TraceStep[] = [
    {
      title: "1. Automate généralisé",
      description:
        "Ajout d'un nouvel état initial i et d'un nouvel état final f reliés par des ε-transitions.",
    },
  ];

  const labelOf = new Map(a.states.map((s) => [s.id, s.label] as const));

  // Élimination des états internes (tous sauf I et F)
  const toEliminate = a.states.map((s) => s.id);
  for (const k of toEliminate) {
    const rkk = R.get(k)!.get(k)!;
    const star = rStar(rkk);
    for (const p of nodes) {
      if (p === k) continue;
      const rpk = R.get(p)!.get(k)!;
      if (rpk === EMPTY) continue;
      for (const r of nodes) {
        if (r === k) continue;
        const rkr = R.get(k)!.get(r)!;
        if (rkr === EMPTY) continue;
        const add = rConcat(rConcat(rpk, star), rkr);
        const cur = R.get(p)!.get(r)!;
        R.get(p)!.set(r, rUnion(cur, add));
      }
    }
    // Couper le nœud k
    for (const p of nodes) {
      R.get(p)!.set(k, EMPTY);
      R.get(k)!.set(p, EMPTY);
    }
    steps.push({
      title: `Élimination de ${labelOf.get(k) ?? k}`,
      description: `Mise à jour R(p,r) = R(p,r) + R(p,k)·R(k,k)*·R(k,r) pour l'état ${labelOf.get(k) ?? k}.`,
    });
  }

  const regex = R.get(I)!.get(F)!;
  const finalRegex = regex === EMPTY ? EMPTY : regex.replace(/^\((.*)\)$/, "$1");

  steps.push({
    title: "Expression régulière finale",
    description: `R(i, f) = ${finalRegex}`,
  });

  const summary: TraceRow[] = [{ "expression régulière": finalRegex }];
  steps[steps.length - 1].table = summary;

  return {
    result: finalRegex,
    steps,
    warnings,
    metrics: { étatsÉliminés: toEliminate.length },
  };
}
