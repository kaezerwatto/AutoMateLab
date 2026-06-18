/**
 * Conversions triviales d'uniformisation de pipeline :
 *  - AFD → AFN (un AFD est un AFN particulier)
 *  - AFN → ε-AFN (ajout du support des ε-transitions sans en créer)
 */
import { AlgorithmResult, Automaton } from "./types";
import { cloneAutomaton } from "./graph-utils";

export function dfaToNfa(a: Automaton): AlgorithmResult<Automaton> {
  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_nfa`;
  clone.name = `${a.name} (vu comme AFN)`;
  clone.kind = "NFA";
  return {
    result: clone,
    steps: [
      {
        title: "AFD → AFN",
        description:
          "Tout AFD est un AFN : la structure est conservée, seul le type change pour uniformiser les traitements.",
        snapshot: clone,
      },
    ],
    warnings: [],
    metrics: { états: clone.states.length },
  };
}

export function nfaToEnfa(a: Automaton): AlgorithmResult<Automaton> {
  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_enfa`;
  clone.name = `${a.name} (ε-AFN)`;
  clone.kind = "ENFA";
  return {
    result: clone,
    steps: [
      {
        title: "AFN → ε-AFN",
        description:
          "On autorise désormais les transitions spontanées ε. Aucune n'est ajoutée : la conversion est triviale.",
        snapshot: clone,
      },
    ],
    warnings: [],
    metrics: { états: clone.states.length },
  };
}

export function dfaToEnfa(a: Automaton): AlgorithmResult<Automaton> {
  const clone = cloneAutomaton(a);
  clone.id = `${a.id}_enfa`;
  clone.name = `${a.name} (ε-AFN)`;
  clone.kind = "ENFA";
  return {
    result: clone,
    steps: [
      {
        title: "AFD → ε-AFN",
        description:
          "Un AFD est un cas particulier d'ε-AFN : on conserve la structure et on autorise les ε-transitions (aucune n'est ajoutée).",
        snapshot: clone,
      },
    ],
    warnings: [],
    metrics: { états: clone.states.length },
  };
}
