/**
 * ε-fermeture : ensemble des états atteignables depuis un état (ou un ensemble
 * d'états) en n'empruntant que des transitions spontanées ε.
 */
import { AlgorithmResult, Automaton, EPSILON, TraceRow } from "./types";

/** ε-fermeture d'un ensemble d'états (Eclose). */
export function epsilonClosure(
  a: Automaton,
  states: Iterable<string>,
): Set<string> {
  const closure = new Set<string>(states);
  const stack = [...closure];
  while (stack.length > 0) {
    const cur = stack.pop()!;
    for (const t of a.transitions) {
      if (t.from === cur && t.symbol === EPSILON && !closure.has(t.to)) {
        closure.add(t.to);
        stack.push(t.to);
      }
    }
  }
  return closure;
}

/** ε-fermeture d'un seul état. */
export function epsilonClosureOf(a: Automaton, stateId: string): Set<string> {
  return epsilonClosure(a, [stateId]);
}

/** ε-fermeture d'UN état donné (résultat pédagogique ciblé). */
export function epsilonClosureOfReport(
  a: Automaton,
  stateId: string,
): AlgorithmResult<string> {
  const state = a.states.find((s) => s.id === stateId);
  if (!state) throw new Error("Sélectionnez un état pour calculer son ε-fermeture.");

  const closure = epsilonClosureOf(a, stateId);
  const labels = a.states
    .filter((x) => closure.has(x.id))
    .map((x) => x.label)
    .join(", ");

  return {
    result: `Eclose(${state.label}) = { ${labels} }`,
    steps: [
      {
        title: `ε-fermeture de ${state.label}`,
        description:
          "On part de l'état puis on suit récursivement toutes les transitions ε.",
        highlightStates: [...closure],
        table: [{ état: state.label, "ε-fermeture": `{ ${labels} }` }],
      },
    ],
    warnings: a.transitions.some((t) => t.symbol === EPSILON)
      ? []
      : ["Aucune transition ε : la fermeture se réduit au singleton."],
    metrics: { taille: closure.size },
  };
}

/** Produit une table de l'ε-fermeture de chaque état (résultat pédagogique). */
export function epsilonClosureReport(a: Automaton): AlgorithmResult<string> {
  const table: TraceRow[] = a.states.map((s) => {
    const closure = epsilonClosureOf(a, s.id);
    const labels = a.states
      .filter((x) => closure.has(x.id))
      .map((x) => x.label)
      .join(", ");
    return { état: s.label, "ε-fermeture": `{ ${labels} }` };
  });

  const hasEpsilon = a.transitions.some((t) => t.symbol === EPSILON);

  return {
    result: "ε-fermetures calculées",
    steps: [
      {
        title: "ε-fermeture de chaque état",
        description:
          "Eclose(q) contient q et tous les états atteignables uniquement par des transitions ε.",
        table,
      },
    ],
    warnings: hasEpsilon
      ? []
      : ["Aucune transition ε : chaque fermeture se réduit au singleton {q}."],
    metrics: { états: a.states.length },
  };
}
