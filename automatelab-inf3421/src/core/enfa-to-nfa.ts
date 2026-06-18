/**
 * Conversion ε-AFN → AFN (élimination des transitions spontanées).
 *
 * Algorithme standard fondé sur les ε-fermetures :
 *   δ_N(q, a) = Eclose( ⋃_{p ∈ Eclose(q)} δ(p, a) )
 *   q est final dans N  ⟺  Eclose(q) contient un état final
 *   l'état initial est conservé.
 *
 * Le langage reconnu est préservé, mais l'automate obtenu ne contient plus
 * aucune ε-transition.
 */
import { AlgorithmResult, Automaton, EPSILON, Transition, TraceRow } from "./types";
import { cloneAutomaton, makeTransition, usedSymbols } from "./graph-utils";
import { epsilonClosure, epsilonClosureOf } from "./epsilon-closure";

export function enfaToNfa(a: Automaton): AlgorithmResult<Automaton> {
  const hasEpsilon = a.transitions.some((t) => t.symbol === EPSILON);
  const symbols = a.alphabet.filter((s) => s !== EPSILON);
  const effective = symbols.length ? symbols : usedSymbols(a);

  // Pré-calcul des ε-fermetures de chaque état.
  const closures = new Map(a.states.map((s) => [s.id, epsilonClosureOf(a, s.id)]));
  const labelOf = new Map(a.states.map((s) => [s.id, s.label]));

  const transitions: Transition[] = [];
  const seen = new Set<string>();
  const table: TraceRow[] = [];

  for (const s of a.states) {
    const ecl = closures.get(s.id)!;
    const row: TraceRow = { état: s.label };

    for (const sym of effective) {
      // États atteints en lisant `sym` depuis la fermeture de q.
      const reached = new Set<string>();
      for (const p of ecl) {
        for (const t of a.transitions) {
          if (t.from === p && t.symbol === sym) reached.add(t.to);
        }
      }
      // On referme par ε.
      const target = epsilonClosure(a, reached);

      for (const to of target) {
        const key = `${s.id}|${sym}|${to}`;
        if (!seen.has(key)) {
          seen.add(key);
          transitions.push(makeTransition(s.id, to, sym));
        }
      }

      const labels = [...target].map((id) => labelOf.get(id)).filter(Boolean).join(", ");
      row[sym] = `{ ${labels} }`;
    }
    table.push(row);
  }

  // Un état devient final si sa fermeture contient un final d'origine.
  const finalIds = new Set(a.states.filter((s) => s.final).map((s) => s.id));
  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_nfa`;
  clone.name = `${a.name} (sans ε)`;
  clone.kind = "NFA";
  clone.alphabet = [...effective];
  clone.transitions = transitions;
  clone.states = clone.states.map((s) => ({
    ...s,
    final: [...closures.get(s.id)!].some((id) => finalIds.has(id)),
  }));

  return {
    result: clone,
    steps: [
      {
        title: "Élimination des ε-transitions",
        description:
          "Pour chaque état q et symbole a : δ_N(q,a) = Eclose(δ(Eclose(q), a)). " +
          "Un état devient final si sa ε-fermeture contient un état final.",
        table,
        snapshot: clone,
      },
    ],
    warnings: hasEpsilon
      ? []
      : ["L'automate n'avait aucune ε-transition : la conversion est l'identité (au type près)."],
    metrics: { états: clone.states.length, transitions: transitions.length },
  };
}
