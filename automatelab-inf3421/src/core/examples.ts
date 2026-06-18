/**
 * Exemples d'automates et d'expressions tirés du cours / TD INF3421.
 */
import { Automaton } from "./types";

export interface ExampleEntry {
  id: string;
  title: string;
  description: string;
  automaton: Automaton;
}

/** AFN reconnaissant les mots se terminant par « abb » sur {a, b}. */
const nfaEndsAbb: Automaton = {
  id: "ex_nfa_abb",
  name: "AFN (a+b)*abb",
  kind: "NFA",
  alphabet: ["a", "b"],
  states: [
    { id: "q0", label: "q0", initial: true, final: false, x: 80, y: 120 },
    { id: "q1", label: "q1", initial: false, final: false, x: 260, y: 120 },
    { id: "q2", label: "q2", initial: false, final: false, x: 440, y: 120 },
    { id: "q3", label: "q3", initial: false, final: true, x: 620, y: 120 },
  ],
  transitions: [
    { id: "t1", from: "q0", to: "q0", symbol: "a" },
    { id: "t2", from: "q0", to: "q0", symbol: "b" },
    { id: "t3", from: "q0", to: "q1", symbol: "a" },
    { id: "t4", from: "q1", to: "q2", symbol: "b" },
    { id: "t5", from: "q2", to: "q3", symbol: "b" },
  ],
};

/** ε-AFN simple : ε-chaîne q0 → q1 → q2. */
const enfaChain: Automaton = {
  id: "ex_enfa",
  name: "ε-AFN ε-chaîne",
  kind: "ENFA",
  alphabet: ["a", "b"],
  states: [
    { id: "q0", label: "q0", initial: true, final: false, x: 80, y: 120 },
    { id: "q1", label: "q1", initial: false, final: false, x: 260, y: 120 },
    { id: "q2", label: "q2", initial: false, final: true, x: 440, y: 120 },
  ],
  transitions: [
    { id: "t1", from: "q0", to: "q1", symbol: "ε" },
    { id: "t2", from: "q1", to: "q2", symbol: "ε" },
    { id: "t3", from: "q0", to: "q0", symbol: "a" },
    { id: "t4", from: "q1", to: "q2", symbol: "b" },
  ],
};

/** AFD incomplet (transition manquante depuis q1 sur b). */
const dfaIncomplete: Automaton = {
  id: "ex_dfa_incomplete",
  name: "AFD incomplet",
  kind: "DFA",
  alphabet: ["a", "b"],
  states: [
    { id: "q0", label: "q0", initial: true, final: false, x: 100, y: 120 },
    { id: "q1", label: "q1", initial: false, final: true, x: 320, y: 120 },
  ],
  transitions: [
    { id: "t1", from: "q0", to: "q1", symbol: "a" },
    { id: "t2", from: "q0", to: "q0", symbol: "b" },
    { id: "t3", from: "q1", to: "q1", symbol: "a" },
  ],
};

/** AFD avec états redondants (à minimiser). */
const dfaToMinimize: Automaton = {
  id: "ex_dfa_min",
  name: "AFD à minimiser",
  kind: "DFA",
  alphabet: ["a", "b"],
  states: [
    { id: "A", label: "A", initial: true, final: false, x: 80, y: 200 },
    { id: "B", label: "B", initial: false, final: false, x: 260, y: 120 },
    { id: "C", label: "C", initial: false, final: false, x: 260, y: 280 },
    { id: "D", label: "D", initial: false, final: true, x: 440, y: 120 },
    { id: "E", label: "E", initial: false, final: true, x: 440, y: 280 },
  ],
  transitions: [
    { id: "t1", from: "A", to: "B", symbol: "a" },
    { id: "t2", from: "A", to: "C", symbol: "b" },
    { id: "t3", from: "B", to: "B", symbol: "a" },
    { id: "t4", from: "B", to: "D", symbol: "b" },
    { id: "t5", from: "C", to: "C", symbol: "a" },
    { id: "t6", from: "C", to: "E", symbol: "b" },
    { id: "t7", from: "D", to: "B", symbol: "a" },
    { id: "t8", from: "D", to: "D", symbol: "b" },
    { id: "t9", from: "E", to: "C", symbol: "a" },
    { id: "t10", from: "E", to: "E", symbol: "b" },
  ],
};

/** Automate avec un état inutile (non co-accessible). */
const dfaWithDeadState: Automaton = {
  id: "ex_dead",
  name: "Automate avec état inutile",
  kind: "NFA",
  alphabet: ["a", "b"],
  states: [
    { id: "q0", label: "q0", initial: true, final: false, x: 80, y: 120 },
    { id: "q1", label: "q1", initial: false, final: true, x: 280, y: 120 },
    { id: "q2", label: "q2 (inutile)", initial: false, final: false, x: 280, y: 280 },
  ],
  transitions: [
    { id: "t1", from: "q0", to: "q1", symbol: "a" },
    { id: "t2", from: "q0", to: "q2", symbol: "b" },
    { id: "t3", from: "q2", to: "q2", symbol: "a" },
  ],
};

export const EXAMPLES: ExampleEntry[] = [
  {
    id: "nfa_abb",
    title: "AFN — (a+b)*abb",
    description: "Mots se terminant par abb. Idéal pour la déterminisation et la minimisation.",
    automaton: nfaEndsAbb,
  },
  {
    id: "enfa_chain",
    title: "ε-AFN — chaîne ε",
    description: "Transitions spontanées pour illustrer l'ε-fermeture.",
    automaton: enfaChain,
  },
  {
    id: "dfa_incomplete",
    title: "AFD incomplet",
    description: "Transition manquante : démontre la complétion vers un AFDC.",
    automaton: dfaIncomplete,
  },
  {
    id: "dfa_min",
    title: "AFD à minimiser",
    description: "Contient des états équivalents à fusionner.",
    automaton: dfaToMinimize,
  },
  {
    id: "dead_state",
    title: "Automate avec état inutile",
    description: "Un état non co-accessible pour illustrer l'émondage.",
    automaton: dfaWithDeadState,
  },
];

export const REGEX_EXAMPLES = [
  "(a+b)*abb",
  "ab*",
  "(a+b)*",
  "a(a+b)*b",
  "(ab)*",
];

export const EQUATION_EXAMPLES = [
  ["X = aX + bY + ε", "Y = aY + bX"].join("\n"),
  ["X = aX + b"].join("\n"),
];

export function getExample(id: string): Automaton | undefined {
  return EXAMPLES.find((e) => e.id === id)?.automaton;
}
