/**
 * Validation des automates : schémas Zod pour l'import JSON et fonctions de
 * vérification métier (déterminisme, complétude, normalisation).
 */
import { z } from "zod";
import { Automaton, AutomatonKind, EPSILON } from "./types";
import { cloneAutomaton, getInitialStates } from "./graph-utils";

/* ------------------------------------------------------------------ */
/* Schémas Zod                                                         */
/* ------------------------------------------------------------------ */

export const stateSchema = z.object({
  id: z.string().min(1, "id d'état requis"),
  label: z.string().min(1, "label requis"),
  initial: z.boolean().optional(),
  final: z.boolean().optional(),
  x: z.number().optional(),
  y: z.number().optional(),
});

export const transitionSchema = z.object({
  id: z.string().min(1),
  from: z.string().min(1),
  to: z.string().min(1),
  symbol: z.string().min(1),
});

export const automatonSchema = z.object({
  id: z.string().min(1),
  name: z.string().min(1),
  kind: z.enum(["DFA", "NFA", "ENFA"]),
  alphabet: z.array(z.string().min(1)),
  states: z.array(stateSchema).min(1, "au moins un état"),
  transitions: z.array(transitionSchema),
});

export type ValidationIssue = {
  level: "error" | "warning";
  message: string;
};

export interface ValidationReport {
  valid: boolean;
  issues: ValidationIssue[];
}

/* ------------------------------------------------------------------ */
/* Validation métier                                                   */
/* ------------------------------------------------------------------ */

/**
 * Valide la cohérence interne d'un automate. Renvoie un rapport listant les
 * erreurs (bloquantes) et avertissements.
 */
export function validateAutomaton(a: Automaton): ValidationReport {
  const issues: ValidationIssue[] = [];

  // 1. Schéma structurel
  const parsed = automatonSchema.safeParse(a);
  if (!parsed.success) {
    for (const e of parsed.error.issues) {
      issues.push({ level: "error", message: `${e.path.join(".")}: ${e.message}` });
    }
    return { valid: false, issues };
  }

  // 2. Identifiants d'état uniques
  const ids = new Set<string>();
  for (const s of a.states) {
    if (ids.has(s.id)) {
      issues.push({ level: "error", message: `État dupliqué : ${s.id}` });
    }
    ids.add(s.id);
  }

  // 3. Un seul état initial conseillé pour AFD
  const initials = getInitialStates(a);
  if (initials.length === 0) {
    issues.push({ level: "error", message: "Aucun état initial défini." });
  }
  if (initials.length > 1 && a.kind === "DFA") {
    issues.push({
      level: "error",
      message: "Un AFD doit avoir exactement un état initial.",
    });
  }

  // 4. Transitions cohérentes
  const alphabet = new Set(a.alphabet);
  for (const t of a.transitions) {
    if (!ids.has(t.from)) {
      issues.push({ level: "error", message: `Transition ${t.id} : état source inconnu (${t.from}).` });
    }
    if (!ids.has(t.to)) {
      issues.push({ level: "error", message: `Transition ${t.id} : état cible inconnu (${t.to}).` });
    }
    if (t.symbol !== EPSILON && !alphabet.has(t.symbol)) {
      issues.push({ level: "error", message: `Transition ${t.id} : symbole « ${t.symbol} » hors alphabet.` });
    }
    if (t.symbol === EPSILON && a.kind !== "ENFA") {
      issues.push({
        level: "error",
        message: `Transition ${t.id} : ε interdit pour un ${a.kind}.`,
      });
    }
  }

  // 5. Déterminisme pour AFD
  if (a.kind === "DFA") {
    const seen = new Map<string, number>();
    for (const t of a.transitions) {
      const key = `${t.from}|${t.symbol}`;
      seen.set(key, (seen.get(key) ?? 0) + 1);
    }
    for (const [key, n] of seen) {
      if (n > 1) {
        const [from, sym] = key.split("|");
        issues.push({
          level: "error",
          message: `Non-déterminisme : ${from} possède ${n} transitions sur « ${sym} ».`,
        });
      }
    }
  }

  return { valid: issues.every((i) => i.level !== "error"), issues };
}

/** Vrai si l'automate est déterministe (au plus une transition par (q,a), pas d'ε). */
export function isDFA(a: Automaton): boolean {
  if (getInitialStates(a).length > 1) return false;
  const seen = new Set<string>();
  for (const t of a.transitions) {
    if (t.symbol === EPSILON) return false;
    const key = `${t.from}|${t.symbol}`;
    if (seen.has(key)) return false;
    seen.add(key);
  }
  return true;
}

/** Vrai si l'AFD est complet : chaque (état, symbole) possède une transition. */
export function isCompleteDFA(a: Automaton): boolean {
  if (!isDFA(a)) return false;
  for (const s of a.states) {
    for (const sym of a.alphabet) {
      const has = a.transitions.some((t) => t.from === s.id && t.symbol === sym);
      if (!has) return false;
    }
  }
  return true;
}

/** Détecte la nature réelle (DFA/NFA/ENFA) d'un automate. */
export function detectKind(a: Automaton): AutomatonKind {
  const hasEpsilon = a.transitions.some((t) => t.symbol === EPSILON);
  if (hasEpsilon) return "ENFA";
  return isDFA(a) ? "DFA" : "NFA";
}

/**
 * Normalise un automate : trie états et transitions, déduplique les
 * transitions identiques et recalcule éventuellement le `kind`.
 */
export function normalizeAutomaton(a: Automaton, recomputeKind = false): Automaton {
  const clone = cloneAutomaton(a);
  clone.states.sort((x, y) => x.id.localeCompare(y.id));

  const seen = new Set<string>();
  clone.transitions = clone.transitions
    .filter((t) => {
      const key = `${t.from}|${t.symbol}|${t.to}`;
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    })
    .sort((x, y) =>
      `${x.from}${x.symbol}${x.to}`.localeCompare(`${y.from}${y.symbol}${y.to}`),
    );

  clone.alphabet = [...new Set(clone.alphabet)].sort();
  if (recomputeKind) clone.kind = detectKind(clone);
  return clone;
}

/** Parse et valide un JSON d'automate. Lève une erreur lisible si invalide. */
export function parseAutomatonJson(json: string): Automaton {
  let data: unknown;
  try {
    data = JSON.parse(json);
  } catch {
    throw new Error("JSON invalide : impossible de parser le contenu.");
  }
  const parsed = automatonSchema.safeParse(data);
  if (!parsed.success) {
    const msg = parsed.error.issues
      .map((e) => `${e.path.join(".")}: ${e.message}`)
      .join("; ");
    throw new Error(`Automate invalide : ${msg}`);
  }
  return parsed.data as Automaton;
}
