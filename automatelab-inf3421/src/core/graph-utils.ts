/**
 * Utilitaires purs sur la structure d'automate : clonage, recherche,
 * normalisation, indexation des transitions et génération d'identifiants
 * déterministes.
 */
import { Automaton, EPSILON, State, SymbolValue, Transition } from "./types";

let counter = 0;
/** Génère un identifiant unique et lisible. */
export function uid(prefix = "id"): string {
  counter += 1;
  return `${prefix}_${Date.now().toString(36)}_${counter.toString(36)}`;
}

/** Clone profond d'un automate (sérialisation JSON, données pures). */
export function cloneAutomaton(a: Automaton): Automaton {
  return {
    id: a.id,
    name: a.name,
    kind: a.kind,
    alphabet: [...a.alphabet],
    states: a.states.map((s) => ({ ...s })),
    transitions: a.transitions.map((t) => ({ ...t })),
  };
}

export function getState(a: Automaton, id: string): State | undefined {
  return a.states.find((s) => s.id === id);
}

export function getInitialStates(a: Automaton): State[] {
  return a.states.filter((s) => s.initial);
}

export function getFinalStates(a: Automaton): State[] {
  return a.states.filter((s) => s.final);
}

export function isEpsilon(t: Transition): boolean {
  return t.symbol === EPSILON;
}

/**
 * Calcule l'ensemble des destinations d'un état pour un symbole donné.
 * Renvoie un tableau d'identifiants d'états (déterminisme non supposé).
 */
export function move(
  a: Automaton,
  fromId: string,
  symbol: SymbolValue,
): string[] {
  return a.transitions
    .filter((t) => t.from === fromId && t.symbol === symbol)
    .map((t) => t.to);
}

/** Move sur un ensemble d'états. */
export function moveSet(
  a: Automaton,
  fromIds: Iterable<string>,
  symbol: SymbolValue,
): Set<string> {
  const result = new Set<string>();
  for (const id of fromIds) {
    for (const to of move(a, id, symbol)) result.add(to);
  }
  return result;
}

/** Liste d'adjacence directe (sans epsilon distinct). */
export function adjacency(a: Automaton): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const s of a.states) map.set(s.id, []);
  for (const t of a.transitions) {
    if (!map.has(t.from)) map.set(t.from, []);
    map.get(t.from)!.push(t.to);
  }
  return map;
}

/** Liste d'adjacence inversée (pour la co-accessibilité). */
export function reverseAdjacency(a: Automaton): Map<string, string[]> {
  const map = new Map<string, string[]>();
  for (const s of a.states) map.set(s.id, []);
  for (const t of a.transitions) {
    if (!map.has(t.to)) map.set(t.to, []);
    map.get(t.to)!.push(t.from);
  }
  return map;
}

/**
 * Crée une transition (avec id auto si absent).
 */
export function makeTransition(
  from: string,
  to: string,
  symbol: string,
  id?: string,
): Transition {
  return { id: id ?? uid("t"), from, to, symbol };
}

/**
 * Réorganise les états sur une grille horizontale simple lorsque les
 * positions ne sont pas définies. Utile avant l'envoi vers le canvas.
 */
export function ensurePositions(a: Automaton, spacing = 160): Automaton {
  const clone = cloneAutomaton(a);
  const cols = Math.max(1, Math.ceil(Math.sqrt(clone.states.length)));
  clone.states.forEach((s, i) => {
    if (s.x === undefined || s.y === undefined) {
      s.x = (i % cols) * spacing + 80;
      s.y = Math.floor(i / cols) * spacing + 80;
    }
  });
  return clone;
}

/**
 * Fusionne les transitions parallèles (même from/to) en regroupant les
 * symboles dans une étiquette « a, b ». Utilisé pour l'affichage et certains
 * algorithmes.
 */
export function groupedEdges(
  a: Automaton,
): { from: string; to: string; symbols: string[] }[] {
  const map = new Map<string, { from: string; to: string; symbols: string[] }>();
  for (const t of a.transitions) {
    const key = `${t.from}->${t.to}`;
    if (!map.has(key)) map.set(key, { from: t.from, to: t.to, symbols: [] });
    map.get(key)!.symbols.push(t.symbol);
  }
  return [...map.values()];
}

/** Renvoie l'alphabet effectif (symboles utilisés, hors epsilon). */
export function usedSymbols(a: Automaton): SymbolValue[] {
  const set = new Set<SymbolValue>();
  for (const t of a.transitions) if (t.symbol !== EPSILON) set.add(t.symbol);
  return [...set].sort();
}

/** Représentation stable et triée d'un ensemble d'états (pour clés/labels). */
export function sortedKey(ids: Iterable<string>): string {
  return [...ids].sort().join(",");
}
