/**
 * Types fondamentaux du domaine AutoMateLab INF3421.
 *
 * Ce module est volontairement indépendant de React et de toute librairie UI :
 * il doit pouvoir être importé tel quel par le moteur algorithmique et par les
 * tests Vitest.
 */

/** Un symbole de l'alphabet (une chaîne, généralement un caractère). */
export type SymbolValue = string;

/** Symbole spécial représentant la transition spontanée (epsilon). */
export const EPSILON = "ε" as const;
export type Epsilon = typeof EPSILON;

/** Nature d'un automate. */
export type AutomatonKind = "DFA" | "NFA" | "ENFA";

/** Coordonnées planaires (utilisées pour le rendu canvas). */
export interface XY {
  x: number;
  y: number;
}

/** Un état de l'automate. */
export interface State {
  id: string;
  label: string;
  initial?: boolean;
  final?: boolean;
  /** Position optionnelle pour le rendu graphique. */
  x?: number;
  y?: number;
}

/** Une transition étiquetée (le symbole peut être EPSILON). */
export interface Transition {
  id: string;
  from: string;
  to: string;
  symbol: SymbolValue | Epsilon;
}

/** Un automate fini complet et sérialisable en JSON. */
export interface Automaton {
  id: string;
  name: string;
  kind: AutomatonKind;
  alphabet: SymbolValue[];
  states: State[];
  transitions: Transition[];
}

/* ------------------------------------------------------------------ */
/* Traces pédagogiques et résultats d'algorithmes                      */
/* ------------------------------------------------------------------ */

/** Une ligne de tableau générique pour les traces. */
export type TraceRow = Record<string, string | number | boolean | null>;

/** Une étape d'explication produite par un algorithme. */
export interface TraceStep {
  title: string;
  description: string;
  /** Tableau optionnel (par exemple table de transition). */
  table?: TraceRow[];
  /** Capture optionnelle de l'automate à cette étape. */
  snapshot?: Automaton;
  /** Mise en évidence d'états (pour la coloration dans le canvas). */
  highlightStates?: string[];
}

/** Résultat standard renvoyé par chaque algorithme du moteur. */
export interface AlgorithmResult<T = Automaton | string> {
  result: T;
  steps: TraceStep[];
  warnings: string[];
  metrics?: Record<string, number | string>;
}

/* ------------------------------------------------------------------ */
/* Workflow (canvas type n8n)                                          */
/* ------------------------------------------------------------------ */

/** Identifiants des opérations disponibles dans le workflow. */
export type OperationType =
  | "inputAutomaton"
  | "inputRegex"
  | "accessible"
  | "coAccessible"
  | "useful"
  | "trim"
  | "completeDfa"
  | "nfaToDfa"
  | "dfaToNfa"
  | "nfaToEnfa"
  | "dfaToEnfa"
  | "enfaToNfa"
  | "epsilonClosure"
  | "enfaToDfa"
  | "minimize"
  | "canonize"
  | "thompson"
  | "glushkov"
  | "automatonToRegex"
  | "complement"
  | "export";

/** Statut d'exécution d'un nœud. */
export type NodeStatus = "idle" | "running" | "success" | "error";

export interface WorkflowNodeData {
  type: OperationType;
  label: string;
  params?: Record<string, unknown>;
  status: NodeStatus;
  /** Résultat de la dernière exécution (sérialisable). */
  result?: AlgorithmResult | null;
  error?: string;
}

export interface WorkflowNode {
  id: string;
  type: OperationType;
  position: XY;
  data: WorkflowNodeData;
}

export interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

export interface Workflow {
  id: string;
  name: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

/** Trace d'exécution complète d'un workflow. */
export interface WorkflowRun {
  id: string;
  startedAt: string;
  finishedAt?: string;
  nodeResults: Record<string, AlgorithmResult | null>;
  status: NodeStatus;
  log: string[];
}

/* ------------------------------------------------------------------ */
/* AST d'expression régulière                                          */
/* ------------------------------------------------------------------ */

export type RegexNodeType =
  | "empty" // ∅ langage vide
  | "epsilon" // mot vide
  | "symbol"
  | "concat"
  | "union"
  | "star"
  | "plus"
  | "optional";

export interface RegexAST {
  type: RegexNodeType;
  value?: string;
  left?: RegexAST;
  right?: RegexAST;
  child?: RegexAST;
}

/** Une équation de langage pour le solveur d'Arden : X = termes. */
export interface LanguageEquation {
  variable: string;
  /** Représentation textuelle saisie par l'utilisateur. */
  raw: string;
}
