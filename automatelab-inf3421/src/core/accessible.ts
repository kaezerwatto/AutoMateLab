/**
 * États accessibles, co-accessibles et utiles.
 *
 *  - Accessible  : atteignable depuis un état initial (parcours direct).
 *  - Co-accessible: peut atteindre un état final (parcours sur le graphe inversé).
 *  - Utile        : accessible ∧ co-accessible.
 */
import { AlgorithmResult, Automaton, TraceStep } from "./types";
import {
  adjacency,
  getFinalStates,
  getInitialStates,
  reverseAdjacency,
} from "./graph-utils";

function bfs(
  starts: string[],
  adj: Map<string, string[]>,
): Set<string> {
  const visited = new Set<string>(starts);
  const queue = [...starts];
  while (queue.length > 0) {
    const cur = queue.shift()!;
    for (const next of adj.get(cur) ?? []) {
      if (!visited.has(next)) {
        visited.add(next);
        queue.push(next);
      }
    }
  }
  return visited;
}

export function getAccessibleStates(a: Automaton): Set<string> {
  const starts = getInitialStates(a).map((s) => s.id);
  return bfs(starts, adjacency(a));
}

export function getCoAccessibleStates(a: Automaton): Set<string> {
  const starts = getFinalStates(a).map((s) => s.id);
  return bfs(starts, reverseAdjacency(a));
}

export function getUsefulStates(a: Automaton): Set<string> {
  const acc = getAccessibleStates(a);
  const co = getCoAccessibleStates(a);
  return new Set([...acc].filter((id) => co.has(id)));
}

/** Liste les états accessibles (résultat ciblé avec coloration). */
export function accessibleReport(a: Automaton): AlgorithmResult<Automaton> {
  const acc = getAccessibleStates(a);
  const labels = a.states.filter((s) => acc.has(s.id)).map((s) => s.label);
  return {
    result: a,
    steps: [
      {
        title: "États accessibles",
        description: `Atteignables depuis l'état initial : { ${labels.join(", ")} }.`,
        highlightStates: [...acc],
      },
    ],
    warnings: [],
    metrics: { accessibles: acc.size, total: a.states.length },
  };
}

/** Liste les états co-accessibles (résultat ciblé avec coloration). */
export function coAccessibleReport(a: Automaton): AlgorithmResult<Automaton> {
  const co = getCoAccessibleStates(a);
  const labels = a.states.filter((s) => co.has(s.id)).map((s) => s.label);
  return {
    result: a,
    steps: [
      {
        title: "États co-accessibles",
        description: `Peuvent atteindre un état final : { ${labels.join(", ")} }.`,
        highlightStates: [...co],
      },
    ],
    warnings: [],
    metrics: { coAccessibles: co.size, total: a.states.length },
  };
}

/** Analyse complète avec trace pédagogique et coloration. */
export function analyzeStates(a: Automaton): AlgorithmResult<Automaton> {
  const accessible = getAccessibleStates(a);
  const coAccessible = getCoAccessibleStates(a);
  const useful = getUsefulStates(a);

  const table = a.states.map((s) => ({
    état: s.label,
    accessible: accessible.has(s.id) ? "oui" : "non",
    "co-accessible": coAccessible.has(s.id) ? "oui" : "non",
    utile: useful.has(s.id) ? "oui" : "non",
  }));

  const steps: TraceStep[] = [
    {
      title: "1. États accessibles",
      description:
        "Parcours en largeur depuis le(s) état(s) initial(aux) en suivant toutes les transitions.",
      highlightStates: [...accessible],
    },
    {
      title: "2. États co-accessibles",
      description:
        "Parcours sur le graphe inversé depuis les états finaux : un état est co-accessible s'il peut atteindre un final.",
      highlightStates: [...coAccessible],
    },
    {
      title: "3. États utiles",
      description: "Intersection des états accessibles et co-accessibles.",
      table,
      highlightStates: [...useful],
    },
  ];

  return {
    result: a,
    steps,
    warnings: [],
    metrics: {
      accessibles: accessible.size,
      coAccessibles: coAccessible.size,
      utiles: useful.size,
      inutiles: a.states.length - useful.size,
    },
  };
}
