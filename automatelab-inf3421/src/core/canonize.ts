/**
 * Canonisation : renommage stable des états en q0, q1, q2... selon un parcours
 * en largeur depuis l'état initial, et tri déterministe des transitions.
 * Produit une forme normale stable, utile pour comparer deux automates.
 */
import { AlgorithmResult, Automaton, State, Transition } from "./types";
import { getInitialStates } from "./graph-utils";

export function canonize(a: Automaton): AlgorithmResult<Automaton> {
  const adj = new Map<string, string[]>();
  for (const s of a.states) adj.set(s.id, []);
  // ordre déterministe des transitions par symbole puis cible
  const sortedTransitions = [...a.transitions].sort(
    (x, y) =>
      x.symbol.localeCompare(y.symbol) || x.to.localeCompare(y.to),
  );
  for (const t of sortedTransitions) {
    adj.get(t.from)?.push(t.to);
  }

  const order: string[] = [];
  const seen = new Set<string>();
  const initials = getInitialStates(a).map((s) => s.id).sort();
  const queue = [...initials];
  for (const id of initials) seen.add(id);

  while (queue.length > 0) {
    const cur = queue.shift()!;
    order.push(cur);
    for (const next of adj.get(cur) ?? []) {
      if (!seen.has(next)) {
        seen.add(next);
        queue.push(next);
      }
    }
  }
  // États non atteints (par sécurité) ajoutés ensuite, triés.
  for (const s of [...a.states].sort((x, y) => x.id.localeCompare(y.id))) {
    if (!seen.has(s.id)) {
      seen.add(s.id);
      order.push(s.id);
    }
  }

  const rename = new Map<string, string>();
  order.forEach((id, i) => rename.set(id, `q${i}`));

  const states: State[] = order.map((id, i) => {
    const old = a.states.find((s) => s.id === id)!;
    return {
      id: rename.get(id)!,
      label: rename.get(id)!,
      initial: old.initial,
      final: old.final,
      x: (i % 5) * 160 + 80,
      y: Math.floor(i / 5) * 140 + 80,
    };
  });

  const transitions: Transition[] = sortedTransitions.map((t, i) => ({
    id: `t${i}`,
    from: rename.get(t.from)!,
    to: rename.get(t.to)!,
    symbol: t.symbol,
  }));

  const canonical: Automaton = {
    id: `${a.id}_canon`,
    name: `${a.name} (canonisé)`,
    kind: a.kind,
    alphabet: [...a.alphabet].sort(),
    states,
    transitions,
  };

  return {
    result: canonical,
    steps: [
      {
        title: "Renommage canonique",
        description:
          "Les états sont renommés q0, q1, … selon un parcours en largeur depuis l'initial, et les transitions sont triées de façon déterministe.",
        snapshot: canonical,
      },
    ],
    warnings: [],
    metrics: { états: states.length },
  };
}
