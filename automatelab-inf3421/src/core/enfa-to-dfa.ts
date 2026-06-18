/**
 * Déterminisation ε-AFN → AFD : combinaison de l'ε-fermeture et de la
 * construction par sous-ensembles.
 */
import { AlgorithmResult, Automaton, State, TraceRow, TraceStep } from "./types";
import {
  getFinalStates,
  getInitialStates,
  makeTransition,
  moveSet,
  sortedKey,
  uid,
} from "./graph-utils";
import { epsilonClosure } from "./epsilon-closure";

interface SubsetState {
  key: string;
  members: Set<string>;
  id: string;
  label: string;
}

export function enfaToDfa(enfa: Automaton): AlgorithmResult<Automaton> {
  const warnings: string[] = [];
  const finals = new Set(getFinalStates(enfa).map((s) => s.id));
  const labelOf = new Map(enfa.states.map((s) => [s.id, s.label] as const));

  const subsetLabel = (members: Set<string>): string => {
    if (members.size === 0) return "∅";
    return `{${[...members].map((id) => labelOf.get(id) ?? id).sort().join(",")}}`;
  };

  const initialRaw = getInitialStates(enfa).map((s) => s.id);
  const initialClosure = epsilonClosure(enfa, initialRaw);

  const subsets = new Map<string, SubsetState>();
  const order: SubsetState[] = [];
  const register = (members: Set<string>): SubsetState => {
    const key = sortedKey(members);
    if (subsets.has(key)) return subsets.get(key)!;
    const st = { key, members, id: uid("d"), label: subsetLabel(members) };
    subsets.set(key, st);
    order.push(st);
    return st;
  };

  const start = register(initialClosure);
  const queue: SubsetState[] = [start];
  const transitions: { from: string; to: string; symbol: string }[] = [];
  const table: TraceRow[] = [];

  const alphabet = enfa.alphabet.filter((s) => s !== "ε");

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const row: TraceRow = { "état AFD": cur.label };
    for (const sym of alphabet) {
      const moved = moveSet(enfa, cur.members, sym);
      const closed = epsilonClosure(enfa, moved);
      const key = sortedKey(closed);
      row[sym] = closed.size === 0 ? "∅" : subsetLabel(closed);
      if (closed.size > 0) {
        const existed = subsets.has(key);
        const ts = register(closed);
        if (!existed) queue.push(ts);
        transitions.push({ from: cur.id, to: ts.id, symbol: sym });
      }
    }
    row["final"] = [...cur.members].some((m) => finals.has(m)) ? "oui" : "non";
    table.push(row);
  }

  const states: State[] = order.map((s, i) => ({
    id: s.id,
    label: s.label,
    initial: s.id === start.id,
    final: [...s.members].some((m) => finals.has(m)),
    x: (i % 4) * 180 + 80,
    y: Math.floor(i / 4) * 140 + 80,
  }));

  const dfa: Automaton = {
    id: `${enfa.id}_dfa`,
    name: `${enfa.name} → AFD`,
    kind: "DFA",
    alphabet,
    states,
    transitions: transitions.map((t) => makeTransition(t.from, t.to, t.symbol)),
  };

  const steps: TraceStep[] = [
    {
      title: "1. ε-fermeture initiale",
      description: `L'état initial de l'AFD est Eclose(initial) = ${start.label}.`,
    },
    {
      title: "2. Move puis ε-fermeture",
      description:
        "Pour chaque ensemble S et symbole a : on calcule Eclose(Move(S, a)). On répète jusqu'à stabilisation.",
      table,
    },
    {
      title: "3. AFD sans transition ε",
      description: `${states.length} état(s) déterministe(s) générés.`,
      snapshot: dfa,
    },
  ];

  return {
    result: dfa,
    steps,
    warnings,
    metrics: { étatsAFD: states.length },
  };
}
