/**
 * Store Zustand de l'automate courant (Automate Studio).
 */
import { create } from "zustand";
import {
  AlgorithmResult,
  Automaton,
  State,
  Transition,
} from "@/core/types";
import { cloneAutomaton, uid } from "@/core/graph-utils";
import { detectKind } from "@/core/validators";
import { EXAMPLES } from "@/core/examples";

interface HistoryEntry {
  label: string;
  result: AlgorithmResult;
  at: string;
}

interface AutomatonState {
  current: Automaton;
  selectedStateId?: string;
  selectedTransitionId?: string;
  /** États mis en surbrillance (résultat d'une analyse). */
  highlight: string[];
  history: HistoryEntry[];

  setAutomaton: (a: Automaton) => void;
  rename: (name: string) => void;
  setAlphabet: (symbols: string[]) => void;

  addState: (x?: number, y?: number) => void;
  updateState: (id: string, patch: Partial<State>) => void;
  removeState: (id: string) => void;
  moveState: (id: string, x: number, y: number) => void;

  addTransition: (from: string, to: string, symbol: string) => void;
  updateTransition: (id: string, patch: Partial<Transition>) => void;
  removeTransition: (id: string) => void;

  select: (stateId?: string, transitionId?: string) => void;
  setHighlight: (ids: string[]) => void;
  clearHighlight: () => void;

  applyResult: (label: string, result: AlgorithmResult) => void;
  pushHistory: (label: string, result: AlgorithmResult) => void;
}

function emptyAutomaton(): Automaton {
  return {
    id: uid("auto"),
    name: "Nouvel automate",
    kind: "NFA",
    alphabet: ["a", "b"],
    states: [
      { id: "q0", label: "q0", initial: true, final: false, x: 120, y: 160 },
    ],
    transitions: [],
  };
}

let stateCounter = 1;

export const useAutomatonStore = create<AutomatonState>((set) => ({
  current: EXAMPLES[0]?.automaton
    ? cloneAutomaton(EXAMPLES[0].automaton)
    : emptyAutomaton(),
  highlight: [],
  history: [],

  setAutomaton: (a) =>
    set({ current: cloneAutomaton(a), highlight: [], selectedStateId: undefined, selectedTransitionId: undefined }),

  rename: (name) => set((s) => ({ current: { ...s.current, name } })),

  setAlphabet: (symbols) =>
    set((s) => ({
      current: {
        ...s.current,
        alphabet: [...new Set(symbols.map((x) => x.trim()).filter(Boolean))],
      },
    })),

  addState: (x, y) =>
    set((s) => {
      const id = uid("s");
      stateCounter += 1;
      const newState: State = {
        id,
        label: `q${s.current.states.length}`,
        initial: s.current.states.length === 0,
        final: false,
        x: x ?? 120 + ((stateCounter * 40) % 400),
        y: y ?? 160 + ((stateCounter * 30) % 240),
      };
      return {
        current: { ...s.current, states: [...s.current.states, newState] },
        selectedStateId: id,
      };
    }),

  updateState: (id, patch) =>
    set((s) => ({
      current: {
        ...s.current,
        states: s.current.states.map((st) =>
          st.id === id ? { ...st, ...patch } : st,
        ),
      },
    })),

  removeState: (id) =>
    set((s) => ({
      current: {
        ...s.current,
        states: s.current.states.filter((st) => st.id !== id),
        transitions: s.current.transitions.filter(
          (t) => t.from !== id && t.to !== id,
        ),
      },
      selectedStateId: undefined,
    })),

  moveState: (id, x, y) =>
    set((s) => ({
      current: {
        ...s.current,
        states: s.current.states.map((st) =>
          st.id === id ? { ...st, x, y } : st,
        ),
      },
    })),

  addTransition: (from, to, symbol) =>
    set((s) => {
      const sym = symbol.trim() || "a";
      const exists = s.current.transitions.some(
        (t) => t.from === from && t.to === to && t.symbol === sym,
      );
      if (exists) return s;
      const alphabet =
        sym !== "ε" && !s.current.alphabet.includes(sym)
          ? [...s.current.alphabet, sym]
          : s.current.alphabet;
      const t: Transition = { id: uid("t"), from, to, symbol: sym };
      const next: Automaton = {
        ...s.current,
        alphabet,
        transitions: [...s.current.transitions, t],
      };
      next.kind = detectKind(next);
      return { current: next };
    }),

  updateTransition: (id, patch) =>
    set((s) => {
      const next: Automaton = {
        ...s.current,
        transitions: s.current.transitions.map((t) =>
          t.id === id ? { ...t, ...patch } : t,
        ),
      };
      next.kind = detectKind(next);
      return { current: next };
    }),

  removeTransition: (id) =>
    set((s) => {
      const next: Automaton = {
        ...s.current,
        transitions: s.current.transitions.filter((t) => t.id !== id),
      };
      next.kind = detectKind(next);
      return { current: next, selectedTransitionId: undefined };
    }),

  select: (stateId, transitionId) =>
    set({ selectedStateId: stateId, selectedTransitionId: transitionId }),

  setHighlight: (ids) => set({ highlight: ids }),
  clearHighlight: () => set({ highlight: [] }),

  applyResult: (label, result) =>
    set((s) => {
      const entry: HistoryEntry = {
        label,
        result,
        at: new Date().toISOString(),
      };
      if (typeof result.result === "string") {
        return { history: [entry, ...s.history].slice(0, 30) };
      }
      return {
        current: cloneAutomaton(result.result),
        highlight: [],
        history: [entry, ...s.history].slice(0, 30),
      };
    }),

  pushHistory: (label, result) =>
    set((s) => ({
      history: [
        { label, result, at: new Date().toISOString() },
        ...s.history,
      ].slice(0, 30),
    })),
}));
