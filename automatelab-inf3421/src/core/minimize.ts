/**
 * Minimisation d'un AFD par raffinement de partitions (Moore / Hopcroft
 * simplifié). L'AFD est d'abord complété et émondé pour garantir un résultat
 * correct.
 */
import { AlgorithmResult, Automaton, State, TraceRow, TraceStep } from "./types";
import { makeTransition } from "./graph-utils";
import { isDFA } from "./validators";
import { completeDfa } from "./complete-dfa";
import { getAccessibleStates } from "./accessible";

export function minimizeDfa(input: Automaton): AlgorithmResult<Automaton> {
  const warnings: string[] = [];
  if (!isDFA(input)) {
    warnings.push("L'entrée n'est pas un AFD ; déterminisez-la d'abord.");
  }

  // 1. Compléter
  const completed = completeDfa(input).result;

  // 2. Restreindre aux états accessibles
  const accessible = getAccessibleStates(completed);
  const states = completed.states.filter((s) => accessible.has(s.id));
  const alphabet = completed.alphabet;
  const delta = new Map<string, string>(); // `${from}|${sym}` -> to
  for (const t of completed.transitions) {
    if (accessible.has(t.from) && accessible.has(t.to)) {
      delta.set(`${t.from}|${t.symbol}`, t.to);
    }
  }

  const finals = new Set(states.filter((s) => s.final).map((s) => s.id));

  // 3. Partition initiale : finaux / non finaux
  let partition: Set<string>[] = [];
  const nonFinals = states.filter((s) => !finals.has(s.id)).map((s) => s.id);
  const finalList = states.filter((s) => finals.has(s.id)).map((s) => s.id);
  if (finalList.length) partition.push(new Set(finalList));
  if (nonFinals.length) partition.push(new Set(nonFinals));

  const blockOf = (id: string): number =>
    partition.findIndex((b) => b.has(id));

  const steps: TraceStep[] = [
    {
      title: "1. Complétion et partition initiale",
      description:
        "On complète l'AFD puis on sépare les états finaux des non finaux.",
      table: partition.map((b, i) => ({
        bloc: `B${i}`,
        états: [...b]
          .map((id) => states.find((s) => s.id === id)?.label)
          .join(", "),
      })),
    },
  ];

  // 4. Raffinement
  let changed = true;
  let iteration = 0;
  while (changed) {
    changed = false;
    iteration += 1;
    const next: Set<string>[] = [];
    for (const block of partition) {
      // signature de chaque état : bloc cible pour chaque symbole
      const groups = new Map<string, string[]>();
      for (const id of block) {
        const sig = alphabet
          .map((sym) => {
            const to = delta.get(`${id}|${sym}`);
            return to !== undefined ? blockOf(to) : -1;
          })
          .join(",");
        if (!groups.has(sig)) groups.set(sig, []);
        groups.get(sig)!.push(id);
      }
      if (groups.size > 1) changed = true;
      for (const g of groups.values()) next.push(new Set(g));
    }
    partition = next;
    if (changed) {
      steps.push({
        title: `Raffinement ${iteration}`,
        description:
          "Deux états restent dans le même bloc seulement si, pour chaque symbole, ils mènent vers le même bloc.",
        table: partition.map((b, i) => ({
          bloc: `B${i}`,
          états: [...b]
            .map((id) => states.find((s) => s.id === id)?.label)
            .join(", "),
        })),
      });
    }
  }

  // 5. Automate quotient
  const blockId = new Map<string, string>();
  partition.forEach((b, i) => {
    for (const id of b) blockId.set(id, `M${i}`);
  });

  const quotientStates: State[] = partition.map((b, i) => {
    const sample = [...b][0];
    const isInitial = [...b].some(
      (id) => states.find((s) => s.id === id)?.initial,
    );
    const isFinal = finals.has(sample) || [...b].some((id) => finals.has(id));
    return {
      id: `M${i}`,
      label: `M${i}`,
      initial: isInitial,
      final: isFinal,
      x: (i % 5) * 160 + 80,
      y: Math.floor(i / 5) * 140 + 80,
    };
  });

  const quotientTransSet = new Set<string>();
  const quotientTransitions = [];
  for (const t of completed.transitions) {
    if (!blockId.has(t.from) || !blockId.has(t.to)) continue;
    const from = blockId.get(t.from)!;
    const to = blockId.get(t.to)!;
    const key = `${from}|${t.symbol}|${to}`;
    if (!quotientTransSet.has(key)) {
      quotientTransSet.add(key);
      quotientTransitions.push(makeTransition(from, to, t.symbol));
    }
  }

  const minimal: Automaton = {
    id: `${input.id}_min`,
    name: `${input.name} (minimal)`,
    kind: "DFA",
    alphabet,
    states: quotientStates,
    transitions: quotientTransitions,
  };

  steps.push({
    title: `${iteration + 1}. Automate quotient`,
    description: `Chaque bloc devient un état. AFD minimal à ${quotientStates.length} état(s).`,
    snapshot: minimal,
  });

  const reductionRows: TraceRow[] = [
    { mesure: "états avant", valeur: states.length },
    { mesure: "états après", valeur: quotientStates.length },
  ];
  steps.push({
    title: "Bilan",
    description: "Comparaison du nombre d'états avant/après minimisation.",
    table: reductionRows,
  });

  return {
    result: minimal,
    steps,
    warnings,
    metrics: {
      étatsAvant: states.length,
      étatsAprès: quotientStates.length,
      blocs: partition.length,
    },
  };
}