/**
 * Émondage : ne conserver que les états utiles (accessibles ∧ co-accessibles)
 * et les transitions reliant deux états utiles.
 */
import { AlgorithmResult, Automaton, TraceStep } from "./types";
import { cloneAutomaton } from "./graph-utils";
import { getUsefulStates } from "./accessible";

export function trimAutomaton(a: Automaton): AlgorithmResult<Automaton> {
  const useful = getUsefulStates(a);
  const removed = a.states.filter((s) => !useful.has(s.id)).map((s) => s.label);

  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_trim`;
  clone.name = `${a.name} (émondé)`;
  clone.states = clone.states.filter((s) => useful.has(s.id));
  clone.transitions = clone.transitions.filter(
    (t) => useful.has(t.from) && useful.has(t.to),
  );

  const steps: TraceStep[] = [
    {
      title: "1. Calcul des états utiles",
      description:
        "On identifie les états à la fois accessibles depuis l'initial et co-accessibles vers un final.",
      highlightStates: [...useful],
    },
    {
      title: "2. Suppression des états inutiles",
      description:
        removed.length > 0
          ? `États supprimés : ${removed.join(", ")}.`
          : "Aucun état inutile : l'automate est déjà émondé.",
      snapshot: clone,
    },
  ];

  return {
    result: clone,
    steps,
    warnings:
      removed.length === 0 ? ["L'automate était déjà émondé."] : [],
    metrics: {
      étatsAvant: a.states.length,
      étatsAprès: clone.states.length,
      étatsSupprimés: removed.length,
    },
  };
}
