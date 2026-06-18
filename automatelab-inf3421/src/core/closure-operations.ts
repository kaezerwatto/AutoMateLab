/**
 * Opérations de clôture sur les langages réguliers :
 * union, concaténation, étoile, intersection, complément, différence.
 */
import { AlgorithmResult, Automaton, EPSILON, State, Transition } from "./types";
import { makeTransition, uid } from "./graph-utils";
import { nfaToDfa } from "./nfa-to-dfa";
import { completeDfa } from "./complete-dfa";
import { isDFA } from "./validators";

/** Préfixe les identifiants d'un automate pour éviter les collisions. */
function prefixed(a: Automaton, prefix: string): Automaton {
  const map = new Map(a.states.map((s) => [s.id, `${prefix}${s.id}`] as const));
  return {
    ...a,
    states: a.states.map((s, i) => ({
      ...s,
      id: map.get(s.id)!,
      label: s.label,
      x: (s.x ?? (i % 5) * 150) ,
      y: (s.y ?? Math.floor(i / 5) * 130),
    })),
    transitions: a.transitions.map((t) => ({
      ...t,
      id: uid("t"),
      from: map.get(t.from)!,
      to: map.get(t.to)!,
    })),
  };
}

function mergedAlphabet(a: Automaton, b: Automaton): string[] {
  return [...new Set([...a.alphabet, ...b.alphabet])].sort();
}

export function unionAutomata(
  a: Automaton,
  b: Automaton,
): AlgorithmResult<Automaton> {
  const pa = prefixed(a, "A_");
  const pb = prefixed(b, "B_");
  const start: State = { id: "U_start", label: "i", initial: true, final: false, x: 20, y: 120 };

  const states: State[] = [
    start,
    ...pa.states.map((s) => ({ ...s, initial: false, x: (s.x ?? 0) + 180 })),
    ...pb.states.map((s) => ({ ...s, initial: false, x: (s.x ?? 0) + 180, y: (s.y ?? 0) + 260 })),
  ];
  const transitions: Transition[] = [...pa.transitions, ...pb.transitions];
  for (const s of pa.states.filter((x) => x.initial))
    transitions.push(makeTransition(start.id, s.id, EPSILON));
  for (const s of pb.states.filter((x) => x.initial))
    transitions.push(makeTransition(start.id, s.id, EPSILON));

  const result: Automaton = {
    id: uid("union"),
    name: `${a.name} ∪ ${b.name}`,
    kind: "ENFA",
    alphabet: mergedAlphabet(a, b),
    states,
    transitions,
  };
  return {
    result,
    steps: [
      {
        title: "Union",
        description:
          "Nouvel état initial relié par ε aux initiaux des deux automates. Les finaux des deux restent finaux.",
        snapshot: result,
      },
    ],
    warnings: [],
    metrics: { états: states.length },
  };
}

export function concatAutomata(
  a: Automaton,
  b: Automaton,
): AlgorithmResult<Automaton> {
  const pa = prefixed(a, "A_");
  const pb = prefixed(b, "B_");

  const states: State[] = [
    ...pa.states,
    ...pb.states.map((s) => ({
      ...s,
      initial: false,
      x: (s.x ?? 0) + 400,
    })),
  ].map((s) => ({ ...s, final: false }));

  // finaux d'origine
  const finalA = new Set(pa.states.filter((s) => s.final).map((s) => s.id));
  const initialB = pb.states.filter((s) => s.initial).map((s) => s.id);
  const finalB = new Set(pb.states.filter((s) => s.final).map((s) => s.id));

  for (const s of states) {
    if (finalB.has(s.id)) s.final = true;
    if (pa.states.find((x) => x.id === s.id)?.initial) s.initial = true;
  }

  const transitions: Transition[] = [...pa.transitions, ...pb.transitions];
  for (const f of finalA) {
    for (const i of initialB) transitions.push(makeTransition(f, i, EPSILON));
  }

  const result: Automaton = {
    id: uid("concat"),
    name: `${a.name} · ${b.name}`,
    kind: "ENFA",
    alphabet: mergedAlphabet(a, b),
    states,
    transitions,
  };
  return {
    result,
    steps: [
      {
        title: "Concaténation",
        description:
          "Les états finaux du premier automate sont reliés par ε aux initiaux du second. Seuls les finaux du second restent finaux.",
        snapshot: result,
      },
    ],
    warnings: [],
    metrics: { états: states.length },
  };
}

export function starAutomaton(a: Automaton): AlgorithmResult<Automaton> {
  const pa = prefixed(a, "S_");
  const newStart: State = { id: "STAR_i", label: "i", initial: true, final: true, x: 20, y: 120 };

  const initials = pa.states.filter((s) => s.initial).map((s) => s.id);
  const finals = pa.states.filter((s) => s.final).map((s) => s.id);

  const states: State[] = [
    newStart,
    ...pa.states.map((s) => ({ ...s, initial: false, final: false, x: (s.x ?? 0) + 180 })),
  ];
  const transitions: Transition[] = [...pa.transitions];
  for (const i of initials) transitions.push(makeTransition(newStart.id, i, EPSILON));
  for (const f of finals) {
    for (const i of initials) transitions.push(makeTransition(f, i, EPSILON));
    transitions.push(makeTransition(f, newStart.id, EPSILON));
  }

  const result: Automaton = {
    id: uid("star"),
    name: `(${a.name})*`,
    kind: "ENFA",
    alphabet: [...a.alphabet],
    states,
    transitions,
  };
  return {
    result,
    steps: [
      {
        title: "Étoile",
        description:
          "Nouvel état initial/final acceptant ε, avec rebouclage par ε des finaux vers les initiaux.",
        snapshot: result,
      },
    ],
    warnings: [],
    metrics: { états: states.length },
  };
}

export function intersectionAutomata(
  a: Automaton,
  b: Automaton,
): AlgorithmResult<Automaton> {
  const alphabet = mergedAlphabet(a, b);
  // produit synchronisé
  const initA = a.states.filter((s) => s.initial);
  const initB = b.states.filter((s) => s.initial);

  const stateKey = (x: string, y: string) => `${x}#${y}`;
  const created = new Map<string, State>();
  const transitions: Transition[] = [];
  const labelA = new Map(a.states.map((s) => [s.id, s.label] as const));
  const labelB = new Map(b.states.map((s) => [s.id, s.label] as const));
  const finalA = new Set(a.states.filter((s) => s.final).map((s) => s.id));
  const finalB = new Set(b.states.filter((s) => s.final).map((s) => s.id));

  const queue: [string, string][] = [];
  const ensure = (x: string, y: string, initial = false): State => {
    const key = stateKey(x, y);
    if (!created.has(key)) {
      const st: State = {
        id: key,
        label: `(${labelA.get(x)},${labelB.get(y)})`,
        initial,
        final: finalA.has(x) && finalB.has(y),
      };
      created.set(key, st);
      queue.push([x, y]);
    }
    return created.get(key)!;
  };

  for (const sa of initA) for (const sb of initB) ensure(sa.id, sb.id, true);

  while (queue.length) {
    const [x, y] = queue.shift()!;
    for (const sym of alphabet) {
      const ax = a.transitions.filter((t) => t.from === x && t.symbol === sym);
      const by = b.transitions.filter((t) => t.from === y && t.symbol === sym);
      for (const ta of ax) {
        for (const tb of by) {
          ensure(ta.to, tb.to);
          transitions.push(makeTransition(stateKey(x, y), stateKey(ta.to, tb.to), sym));
        }
      }
    }
  }

  const states = [...created.values()];
  states.forEach((s, i) => {
    s.x = (i % 5) * 170 + 60;
    s.y = Math.floor(i / 5) * 140 + 60;
  });

  const result: Automaton = {
    id: uid("inter"),
    name: `${a.name} ∩ ${b.name}`,
    kind: "NFA",
    alphabet,
    states,
    transitions,
  };
  return {
    result,
    steps: [
      {
        title: "Intersection (produit cartésien)",
        description:
          "Les états sont des couples (p, q) ; un état est final si ses deux composantes sont finales.",
        snapshot: result,
      },
    ],
    warnings: [],
    metrics: { états: states.length },
  };
}

export function complementAutomaton(a: Automaton): AlgorithmResult<Automaton> {
  const warnings: string[] = [];
  let dfa = a;
  if (!isDFA(a)) {
    warnings.push("Automate non déterministe : déterminisation préalable.");
    dfa = nfaToDfa(a).result;
  }
  const completed = completeDfa(dfa).result;
  const result: Automaton = {
    ...completed,
    id: uid("comp"),
    name: `complément(${a.name})`,
    states: completed.states.map((s) => ({ ...s, final: !s.final })),
  };
  return {
    result,
    steps: [
      {
        title: "Complément",
        description:
          "On complète l'AFD puis on inverse les états finaux et non finaux.",
        snapshot: result,
      },
    ],
    warnings,
    metrics: { états: result.states.length },
  };
}

export function differenceAutomata(
  a: Automaton,
  b: Automaton,
): AlgorithmResult<Automaton> {
  const comp = complementAutomaton(b).result;
  const inter = intersectionAutomata(a, comp);
  return {
    result: { ...inter.result, id: uid("diff"), name: `${a.name} \\ ${b.name}` },
    steps: [
      {
        title: "Différence",
        description: "L(A) \\ L(B) = L(A) ∩ complément(L(B)).",
      },
      ...inter.steps,
    ],
    warnings: inter.warnings,
    metrics: inter.metrics,
  };
}
