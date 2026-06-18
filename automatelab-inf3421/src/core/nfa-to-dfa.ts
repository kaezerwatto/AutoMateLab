/**
 * Déterminisation AFN → AFD par construction des sous-ensembles.
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

interface SubsetState {
  key: string;
  members: Set<string>;
  id: string;
  label: string;
}

export function nfaToDfa(nfa: Automaton): AlgorithmResult<Automaton> {
  const warnings: string[] = [];
  const finals = new Set(getFinalStates(nfa).map((s) => s.id));
  const labelOf = new Map(nfa.states.map((s) => [s.id, s.label] as const));

  const subsetLabel = (members: Set<string>): string => {
    if (members.size === 0) return "∅";
    return `{${[...members].map((id) => labelOf.get(id) ?? id).sort().join(",")}}`;
  };

  const initial = new Set(getInitialStates(nfa).map((s) => s.id));
  if (initial.size === 0) {
    warnings.push("Aucun état initial : l'AFD résultant est vide.");
  }

  const subsets = new Map<string, SubsetState>();
  const order: SubsetState[] = [];

  const register = (members: Set<string>): SubsetState => {
    const key = sortedKey(members);
    if (subsets.has(key)) return subsets.get(key)!;
    const st: SubsetState = {
      key,
      members,
      id: uid("d"),
      label: subsetLabel(members),
    };
    subsets.set(key, st);
    order.push(st);
    return st;
  };

  const start = register(initial);
  const queue: SubsetState[] = [start];
  const transitions = [] as { from: string; to: string; symbol: string }[];
  const table: TraceRow[] = [];

  while (queue.length > 0) {
    const cur = queue.shift()!;
    const row: TraceRow = { "état AFD": cur.label };
    for (const sym of nfa.alphabet) {
      const target = moveSet(nfa, cur.members, sym);
      const key = sortedKey(target);
      row[sym] = target.size === 0 ? "∅" : subsetLabel(target);
      if (target.size > 0) {
        const existed = subsets.has(key);
        const ts = register(target);
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
    id: `${nfa.id}_dfa`,
    name: `${nfa.name} → AFD`,
    kind: "DFA",
    alphabet: [...nfa.alphabet],
    states,
    transitions: transitions.map((t) => makeTransition(t.from, t.to, t.symbol)),
  };

  const steps: TraceStep[] = [
    {
      title: "1. État initial de l'AFD",
      description: `L'état initial est l'ensemble ${start.label}.`,
    },
    {
      title: "2. Construction par sous-ensembles",
      description:
        "Pour chaque ensemble et chaque symbole, on calcule Move(S, a). Tout nouvel ensemble non vide devient un état de l'AFD.",
      table,
    },
    {
      title: "3. AFD obtenu",
      description: `${states.length} état(s) déterministe(s) générés.`,
      snapshot: dfa,
    },
  ];

  return {
    result: dfa,
    steps,
    warnings,
    metrics: { étatsAFN: nfa.states.length, étatsAFD: states.length },
  };
}
