/**
 * Complétion AFD → AFDC.
 *
 * Pour chaque couple (état, symbole) sans transition, on ajoute une transition
 * vers un état puits ⊥ unique. Le puits boucle sur lui-même pour tout symbole.
 */
import { AlgorithmResult, Automaton, TraceRow, TraceStep } from "./types";
import { cloneAutomaton, makeTransition } from "./graph-utils";
import { isDFA } from "./validators";

export const SINK_ID = "__sink__";

export function completeDfa(a: Automaton): AlgorithmResult<Automaton> {
  const warnings: string[] = [];
  if (!isDFA(a)) {
    warnings.push(
      "L'automate fourni n'est pas un AFD déterministe ; la complétion suppose le déterminisme.",
    );
  }

  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_complete`;
  clone.name = `${a.name} (complété)`;
  clone.kind = "DFA";

  const missing: TraceRow[] = [];
  for (const s of a.states) {
    for (const sym of a.alphabet) {
      const has = clone.transitions.some(
        (t) => t.from === s.id && t.symbol === sym,
      );
      if (!has) missing.push({ état: s.label, symbole: sym, destination: "⊥" });
    }
  }

  const steps: TraceStep[] = [
    {
      title: "1. Recherche des transitions manquantes",
      description:
        "On vérifie pour chaque état et chaque symbole de l'alphabet l'existence d'une transition.",
      table: missing.length > 0 ? missing : undefined,
    },
  ];

  if (missing.length === 0) {
    steps.push({
      title: "2. Automate déjà complet",
      description: "Toutes les transitions (q, a) existent : aucun puits ajouté.",
      snapshot: clone,
    });
    return {
      result: clone,
      steps,
      warnings: [...warnings, "L'AFD était déjà complet."],
      metrics: { puitsAjouté: 0, transitionsAjoutées: 0 },
    };
  }

  // Ajout de l'état puits
  clone.states.push({ id: SINK_ID, label: "⊥", initial: false, final: false });

  let added = 0;
  for (const s of a.states) {
    for (const sym of a.alphabet) {
      const has = clone.transitions.some(
        (t) => t.from === s.id && t.symbol === sym,
      );
      if (!has) {
        clone.transitions.push(makeTransition(s.id, SINK_ID, sym));
        added += 1;
      }
    }
  }
  // Boucles du puits
  for (const sym of a.alphabet) {
    clone.transitions.push(makeTransition(SINK_ID, SINK_ID, sym));
    added += 1;
  }

  steps.push({
    title: "2. Ajout de l'état puits ⊥",
    description: `Création de l'état puits ⊥ et ajout de ${added} transition(s), dont les boucles ⊥ →(a)→ ⊥.`,
    snapshot: clone,
    highlightStates: [SINK_ID],
  });

  return {
    result: clone,
    steps,
    warnings,
    metrics: { puitsAjouté: 1, transitionsAjoutées: added },
  };
}
